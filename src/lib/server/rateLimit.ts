import { dev } from '$app/environment';
import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

type RateLimitOptions = {
    windowMs: number;
    max: number;
    message?: string;
    skipInDevelopment?: boolean;
};

type RateLimitStore = {
    [key: string]: {
        count: number;
        resetTime: number;
    };
};

// Extract client IP address from request
function getClientIP(event: RequestEvent): string {
    const forwarded = event.request.headers.get('x-forwarded-for');
    const realIp = event.request.headers.get('x-real-ip');
    const cfConnectingIp = event.request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIp) {
        return realIp;
    }
    if (cfConnectingIp) {
        return cfConnectingIp;
    }
    
    // Fallback to connection info (might not be available in all environments)
    return event.getClientAddress() || 'unknown';
}

// Simple IP extraction for endpoint handlers
function extractClientIP(request: Request, getClientAddress: () => string): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIp) {
        return realIp;
    }
    if (cfConnectingIp) {
        return cfConnectingIp;
    }
    
    // Fallback to connection info
    try {
        return getClientAddress() || 'unknown';
    } catch {
        return 'unknown';
    }
}

export function createRateLimiter(options: RateLimitOptions) {
    const store: RateLimitStore = {};
    const message = options.message || 'Too many requests, please try again later';

    return {
        async check(ip: string) {
            // Skip rate limiting in development if specified
            if (dev && options.skipInDevelopment) {
                console.log(`[RATE_LIMIT] Skipping rate limit in development mode for IP: ${ip}`);
                return true;
            }
            
            console.log(`[RATE_LIMIT] Checking rate limit for IP: ${ip}, dev: ${dev}, skipInDevelopment: ${options.skipInDevelopment}`);

            const now = Date.now();
            const windowStart = now - options.windowMs;

            // Clean old entries periodically
            if (Math.random() < 0.1) { // 10% chance of cleanup
                Object.keys(store).forEach(key => {
                    if (store[key].resetTime < windowStart) {
                        delete store[key];
                    }
                });
            }

            // Check/Create rate limit entry
            if (!store[ip]) {
                store[ip] = {
                    count: 1,
                    resetTime: now + options.windowMs
                };
                return true;
            }

            // Reset if window expired
            if (store[ip].resetTime < now) {
                store[ip] = {
                    count: 1,
                    resetTime: now + options.windowMs
                };
                return true;
            }

            // Increment and check
            store[ip].count++;
            if (store[ip].count > options.max) {
                const resetInSeconds = Math.ceil((store[ip].resetTime - now) / 1000);
                throw new Error(JSON.stringify({
                    error: message,
                    retryAfter: resetInSeconds,
                    limit: options.max,
                    remaining: 0
                }));
            }

            return true;
        },

        // Get rate limit info without incrementing counter
        info(ip: string) {
            const entry = store[ip];
            if (!entry || entry.resetTime < Date.now()) {
                return {
                    limit: options.max,
                    remaining: options.max,
                    resetTime: Date.now() + options.windowMs
                };
            }
            return {
                limit: options.max,
                remaining: Math.max(0, options.max - entry.count),
                resetTime: entry.resetTime
            };
        }
    };
}

// Rate limiting middleware factory
export function createRateLimitMiddleware(options: RateLimitOptions) {
    const limiter = createRateLimiter(options);

    return async (event: RequestEvent) => {
        const ip = getClientIP(event);
        
        try {
            await limiter.check(ip);
            const info = limiter.info(ip);
            
            // Add rate limit headers
            return {
                headers: {
                    'X-RateLimit-Limit': options.max.toString(),
                    'X-RateLimit-Remaining': info.remaining.toString(),
                    'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString()
                }
            };
        } catch (error) {
            if (error instanceof Error) {
                try {
                    const errorData = JSON.parse(error.message);
                    return json(errorData, { 
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': options.max.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': Math.ceil((Date.now() + (errorData.retryAfter * 1000)) / 1000).toString(),
                            'Retry-After': errorData.retryAfter.toString()
                        }
                    });
                } catch {
                    return json(
                        { error: 'Rate limit exceeded' },
                        { status: 429 }
                    );
                }
            }
            return json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }
    };
}

// Predefined rate limiters for different endpoint types
export const authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    skipInDevelopment: true
});

export const aiQueryRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 AI queries per minute
    message: 'Too many AI queries. Please wait before making another request.',
    skipInDevelopment: true
});

export const apiRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many API requests. Please slow down.',
    skipInDevelopment: true
});

export const strictRateLimit = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Rate limit exceeded for this sensitive operation.',
    skipInDevelopment: true
});

// Helper function to apply rate limiting to any endpoint
export async function applyRateLimit(
    event: RequestEvent,
    limiter: ReturnType<typeof createRateLimiter>
) {
    const ip = getClientIP(event);
    
    try {
        await limiter.check(ip);
        const info = limiter.info(ip);
        
        return {
            success: true,
            headers: {
                'X-RateLimit-Limit': info.limit.toString(),
                'X-RateLimit-Remaining': info.remaining.toString(),
                'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString()
            }
        };
    } catch (error) {
        if (error instanceof Error) {
            try {
                const errorData = JSON.parse(error.message);
                return {
                    success: false,
                    response: json(errorData, { 
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': errorData.limit.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': Math.ceil((Date.now() + (errorData.retryAfter * 1000)) / 1000).toString(),
                            'Retry-After': errorData.retryAfter.toString()
                        }
                    })
                };
            } catch {
                return {
                    success: false,
                    response: json(
                        { error: 'Rate limit exceeded' },
                        { status: 429 }
                    )
                };
            }
        }
        return {
            success: false,
            response: json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            )
        };
    }
}

export { getClientIP, extractClientIP };