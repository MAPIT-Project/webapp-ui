# Rate Limiting Implementation

This document describes the rate limiting implementation for the webapp-ui application.

## Overview

The application implements multi-tier rate limiting to protect against various types of abuse:

1. **Global API Rate Limiting**: Applied to all API routes
2. **Authentication Rate Limiting**: Applied to login/register endpoints
3. **AI Query Rate Limiting**: Applied to expensive AI operations
4. **Strict Rate Limiting**: Applied to sensitive operations

## Rate Limiting Tiers

### 1. Global API Rate Limiting
- **Limit**: 100 requests per minute per IP
- **Window**: 1 minute
- **Applied to**: All `/api/*` routes
- **Purpose**: Prevent general API abuse

### 2. Authentication Rate Limiting
- **Limit**: 5 attempts per 15 minutes per IP
- **Window**: 15 minutes
- **Applied to**: `/api/auth/login` and `/api/auth/register`
- **Purpose**: Prevent brute force attacks and spam registrations

### 3. AI Query Rate Limiting
- **Limit**: 10 requests per minute per IP
- **Window**: 1 minute
- **Applied to**: `/api/query`, `/api/chat/ai-message`
- **Purpose**: Prevent abuse of expensive AI operations

### 4. Strict Rate Limiting
- **Limit**: 5 requests per minute per IP
- **Window**: 1 minute
- **Applied to**: Sensitive operations (can be applied as needed)
- **Purpose**: Extra protection for critical operations

## Implementation Details

### Core Components

#### 1. Rate Limiter (`src/lib/server/rateLimit.ts`)
- In-memory storage for rate limit counters
- Automatic cleanup of expired entries
- Configurable windows and limits
- IP-based tracking with proxy support

#### 2. IP Address Extraction
The system extracts client IP addresses from various sources:
- `X-Forwarded-For` header (load balancers)
- `X-Real-IP` header (reverse proxies)
- `CF-Connecting-IP` header (Cloudflare)
- Direct connection IP (fallback)

#### 3. Rate Limit Headers
All responses include standard rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (when rate limited)

### Applied Endpoints

#### Authentication Endpoints
- `/api/auth/login` - 5 attempts per 15 minutes
- `/api/auth/register` - 5 attempts per 15 minutes

#### AI/Query Endpoints
- `/api/query` - 10 requests per minute
- `/api/chat/ai-message` - 10 requests per minute

#### Global Protection
- All `/api/*` routes - 100 requests per minute

## Configuration

### Environment-Based Configuration

Rate limiting can be configured based on environment:

```typescript
// Development mode
skipInDevelopment: true  // Rate limiting disabled in dev

// Production mode
skipInDevelopment: false // Rate limiting always active
```

### Custom Rate Limiters

Create custom rate limiters for specific needs:

```typescript
import { createRateLimiter } from '$lib/server/rateLimit';

const customRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes
  message: 'Custom rate limit exceeded',
  skipInDevelopment: true
});
```

### Applying Rate Limits

#### Method 1: Using applyRateLimit Helper
```typescript
import { applyRateLimit, authRateLimit } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const rateLimitResult = await applyRateLimit(
    { request, getClientAddress },
    authRateLimit
  );
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  // Your endpoint logic here
};
```

#### Method 2: Direct Rate Limiter Usage
```typescript
import { authRateLimit, getClientIP } from '$lib/server/rateLimit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const ip = getClientIP({ request, getClientAddress });
  
  try {
    await authRateLimit.check(ip);
  } catch (error) {
    // Handle rate limit exceeded
    return json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  
  // Your endpoint logic here
};
```

## Monitoring and Debugging

### Rate Limit Information
Get current rate limit status without incrementing:

```typescript
const info = rateLimiter.info(ip);
console.log(`Limit: ${info.limit}, Remaining: ${info.remaining}`);
```

### Headers in Response
Check rate limit headers in network tools:
- Look for `X-RateLimit-*` headers in responses
- `Retry-After` header indicates when to retry after rate limit

### Development Mode
- Rate limiting is disabled in development by default
- Can be enabled by setting `skipInDevelopment: false`

## Error Responses

### Rate Limited Response
```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0
}
```

### Headers on Rate Limited Response
```
Status: 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Best Practices

### 1. Client-Side Handling
- Always check for 429 status codes
- Respect `Retry-After` header
- Show user-friendly messages for rate limits
- Implement exponential backoff for retries

### 2. Rate Limit Tuning
- Monitor actual usage patterns
- Adjust limits based on legitimate user behavior
- Consider different limits for authenticated vs anonymous users

### 3. Security Considerations
- Rate limiting is IP-based, consider user-based limits for authenticated routes
- Combine with other security measures (CSRF tokens, etc.)
- Monitor for patterns that bypass rate limiting

## Future Enhancements

### 1. Database Storage
Replace in-memory storage with database for:
- Persistence across server restarts
- Clustering support
- Better observability

### 2. User-Based Rate Limiting
Implement rate limiting per authenticated user:
- Different limits for different user tiers
- More granular control
- Better user experience

### 3. Dynamic Rate Limiting
Adjust limits based on:
- Server load
- Time of day
- User behavior patterns
- Abuse detection

### 4. Monitoring Integration
- Export metrics to monitoring systems
- Alerting on rate limit violations
- Dashboard for rate limit analytics

## Troubleshooting

### Common Issues

1. **Rate limits too strict**: Adjust limits based on usage patterns
2. **IP extraction fails**: Check proxy configuration and headers
3. **Rate limits not working**: Verify middleware order in `hooks.server.ts`
4. **Development rate limits**: Check `skipInDevelopment` setting

### Testing Rate Limits

```bash
# Test authentication rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:5173/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Request $i completed"
done

# Test AI query rate limiting
for i in {1..12}; do
  curl -X POST http://localhost:5173/api/query \
    -H "Content-Type: application/json" \
    -d '{"question":"test question"}'
  echo "Request $i completed"
done
```

## Configuration Examples

### Environment Variables
```env
# Enable strict rate limiting in production
PUBLIC_APP_ENV=production

# Disable rate limiting in development
PUBLIC_APP_ENV=development
```

### Custom Limits for Different Environments
```typescript
const getRateLimit = (env: string) => {
  switch (env) {
    case 'production':
      return { windowMs: 60000, max: 100, skipInDevelopment: false };
    case 'testing':
      return { windowMs: 60000, max: 1000, skipInDevelopment: false };
    default:
      return { windowMs: 60000, max: 10000, skipInDevelopment: true };
  }
};
``` 