# MAP-IT Deployment & Setup Guide

## Overview
This guide covers the complete setup and deployment process for the MAP-IT application, including backend connectivity, Supabase configuration, NGINX reverse proxy setup, and common troubleshooting.

## Architecture
- **Frontend**: SvelteKit app running on Node.js with PM2
- **Backend**: FastAPI application (Python) running on port 18000
- **Database**: Supabase (local) running on port 54321
- **Web Server**: NGINX reverse proxy
- **Domain**: mapit.work (HTTPS with Let's Encrypt SSL)

## Prerequisites

### Server Requirements
- Debian/Ubuntu VPS with at least 4GB RAM
- Node.js 18+ and npm
- Python 3.9+
- PM2 process manager
- NGINX web server
- Let's Encrypt for SSL certificates

### Local Development Requirements
- Node.js 18+
- npm or yarn
- Git

## Environment Setup

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd webapp-ui

# Install dependencies
npm install

# Copy environment files
cp .env.example .env
```

### 2. Configure Environment Variables

#### Development (.env)
```bash
# Database
PRIVATE_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Backend API
BACKEND_URL="http://localhost:18000"

# Supabase Local Development
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_ANON_KEY="your-local-supabase-key"
PUBLIC_SUPABASE_URL="http://localhost:54321"
PUBLIC_SUPABASE_ANON_KEY="your-local-supabase-key"
PUBLIC_SUPABASE_SERVICE_KEY="your-local-supabase-service-key"

# API Keys
GOOGLE_API_KEY="your-google-api-key"
MAPBOX_API_KEY="your-mapbox-api-key"
```

#### Production (.env.production on VPS)
```bash
# Database
PRIVATE_DATABASE_URL="postgresql://user:password@localhost:54322/postgres"

# Backend API
BACKEND_URL="http://localhost:18000"

# Supabase Production (HTTPS via reverse proxy)
VITE_SUPABASE_URL="https://mapit.work/supabase"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
PUBLIC_SUPABASE_URL="https://mapit.work/supabase"
PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
PUBLIC_SUPABASE_SERVICE_KEY="your-supabase-service-key"

# API Keys
GOOGLE_API_KEY="your-google-api-key"
MAPBOX_API_KEY="your-mapbox-api-key"
```

## 3. NGINX Configuration

### Critical: HTTPS Cookie Configuration
The app runs on HTTPS, so cookies MUST be set with `secure: true` in the login endpoint.

**File**: `src/routes/api/auth/login/+server.ts`
```typescript
cookies.set(name, value, {
    ...options,
    path: '/',
    httpOnly: false,
    secure: true, // ⚠️ MUST be true for HTTPS
    sameSite: 'lax'
});
```

### Supabase Reverse Proxy Setup

**File**: `/etc/nginx/sites-available/mapit.conf`

Add this location block for Supabase reverse proxy:

```nginx
# === SUPABASE REVERSE PROXY ===
location /supabase/ {
    rewrite ^/supabase/(.*) /$1 break;
    proxy_pass http://127.0.0.1:54321;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization "";
    proxy_hide_header Upgrade;
    proxy_read_timeout 86400;
}
```

**Complete NGINX Configuration**: See `/etc/nginx/sites-available/mapit.conf` for full setup including SSL, API proxying, and static file serving.

## 4. Backend Setup

### Start Backend Service
```bash
cd MAP-IT_SA  # Backend directory
make docker-up  # Or: docker-compose up -d
```

The backend should be accessible at `http://localhost:18000`.

### Verify Backend
```bash
curl http://localhost:18000/api/health
```

## 5. Build and Deploy

### Development Mode
```bash
npm run dev
# Access at http://localhost:5173
```

### Production Build
```bash
# Build with production environment
npm run build:prod

# Or build with dev environment
npm run build:dev
```

### PM2 Deployment
```bash
# Start with PM2
pm2 start npm --name mapit-ui -- start

# Or use the convenience script
npm run host

# Save PM2 configuration
pm2 save
pm2 startup
```

### PM2 Management Commands
```bash
npm run pm2:logs      # View logs
npm run pm2:stop       # Stop app
npm run pm2:restart    # Restart app
npm run pm2:delete     # Remove from PM2
```

## 6. Common Issues & Solutions

### Issue 1: Mixed Content Errors
**Problem**: Browser blocks requests from HTTPS to HTTP endpoints.

**Solution**: 
- Ensure all services use HTTPS or are behind reverse proxy
- Update Supabase URL to use reverse proxy: `https://mapit.work/supabase`
- Never use `http://` URLs in production when app runs on HTTPS

### Issue 2: SSL Protocol Errors
**Problem**: `ERR_SSL_PROTOCOL_ERROR` when accessing Supabase.

**Solution**:
- Don't use HTTPS with non-standard ports (like `:54321`)
- Set up NGINX reverse proxy for Supabase
- Use `https://mapit.work/supabase` instead of `https://mapit.work:54321`

### Issue 3: Login Works But No Redirect
**Problem**: User can log in but doesn't get redirected to dashboard.

**Solution**:
- Ensure cookies are set with `secure: true` for HTTPS
- Check cookie settings in `src/routes/api/auth/login/+server.ts`
- Verify NGINX isn't stripping cookie headers

### Issue 4: Conversation Pages Won't Load
**Problem**: API request succeeds but page doesn't load messages.

**Solution**:
- Check browser console for JavaScript errors
- Verify backend is accessible: `curl http://localhost:18000/api/health`
- Check PM2 logs: `pm2 logs mapit-ui`
- Ensure environment variables are correct in production build

### Issue 5: Backend Connection Refused
**Problem**: `ECONNREFUSED` errors when proxying to backend.

**Solution**:
- Start backend service: `cd ../MAP-IT_SA && make docker-up`
- Verify backend URL in environment variables
- Check if backend port matches (default: 18000)
- Test backend directly: `curl http://localhost:18000/api/health`

## 7. Monitoring & Debugging

### Backend Status API
```bash
# Check backend connectivity
curl http://localhost:5173/api/backend-status

# Expected response when connected:
{
  "status": "connected",
  "backend_url": "http://localhost:18000",
  "response_time_ms": 45,
  "http_status": 200
}
```

### Debug Scripts
```bash
# Comprehensive debugging
./debug-logs.sh

# Environment check
./check-env.sh
```

### Browser Console Logging
The app includes comprehensive logging:
- `[BackendStatus]` - Backend connectivity checks
- `[BackendStatusAPI]` - Server-side backend checks
- `[ConversationPage]` - Page loading and message fetching
- `[SUPABASE CLIENT]` - Supabase initialization

## 8. Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured correctly
- [ ] Backend service running and accessible
- [ ] Supabase running on port 54321
- [ ] NGINX configured with Supabase reverse proxy
- [ ] SSL certificates valid and not expired

### Deployment
- [ ] Build application: `npm run build:prod`
- [ ] Stop existing PM2 process: `pm2 stop mapit-ui`
- [ ] Start new PM2 process: `pm2 start npm --name mapit-ui -- start`
- [ ] Save PM2 config: `pm2 save`

### Post-Deployment
- [ ] Test login flow
- [ ] Test dashboard access
- [ ] Test conversation page loading
- [ ] Verify no mixed content errors
- [ ] Check backend connectivity
- [ ] Monitor PM2 logs for errors

## 9. Architecture Diagram

```
User Browser (HTTPS)
    ↓
NGINX (SSL Termination)
    ↓
┌─────────────────────────────┐
│  SvelteKit App (PM2)        │
│  - Port: 5173 (internal)     │
│  - Environment: Production    │
└─────────────────────────────┘
    ↓                 ↓
┌──────────────┐  ┌─────────────────┐
│  Supabase    │  │   Backend API   │
│  (Reverse    │  │   (FastAPI)     │
│   Proxy)     │  │   Port: 18000   │
│  /supabase/  │  └─────────────────┘
│  → 54321     │
└──────────────┘
```

## 10. Key Files Reference

### Configuration Files
- `.env` / `.env.production` - Environment variables
- `package.json` - Dependencies and scripts
- `svelte.config.js` - SvelteKit configuration
- `vite.config.ts` - Vite build configuration

### NGINX Files
- `/etc/nginx/sites-available/mapit.conf` - Main NGINX configuration
- `/etc/letsencrypt/live/mapit.work/` - SSL certificates

### Source Files
- `src/routes/api/auth/login/+server.ts` - Login endpoint (cookie settings)
- `src/hooks.server.ts` - Authentication middleware
- `src/lib/clients/supabaseClient.ts` - Supabase client
- `src/lib/stores/backendStatusStore.ts` - Backend connectivity monitoring

## 11. Developer Notes

### Cookie Security
- **Development**: `secure: false, httpOnly: false, sameSite: 'lax'`
- **Production**: `secure: true, httpOnly: false, sameSite: 'lax'`

### Environment Variables Priority
1. `.env.production` (highest priority in production builds)
2. `.env` (development and fallback)
3. System environment variables

### Build Scripts
- `npm run dev` - Development server
- `npm run build` - Standard build (uses .env)
- `npm run build:prod` - Production build (uses .env.production)
- `npm run host` - Build and deploy with PM2

### Backend Status Monitoring
The app includes a backend status indicator in the chat header:
- 🟢 Green: Backend connected
- 🔴 Red: Backend disconnected  
- 🟡 Yellow: Checking status

## 12. Troubleshooting Commands

### Quick Health Checks
```bash
# Check all services
curl http://localhost:18000/api/health                    # Backend
curl https://mapit.work/supabase/rest/v1/                  # Supabase
curl http://localhost:5173/api/backend-status              # Frontend API

# Process status
pm2 status                                                   # PM2 processes
sudo systemctl status nginx                                 # NGINX
sudo systemctl status docker                                # Docker (backend)

# Logs
pm2 logs mapit-ui --lines 50                               # App logs
sudo tail -f /var/log/nginx/error.log                      # NGINX logs
```

### Reset Procedures
```bash
# Reset application
pm2 stop mapit-ui
npm run build:prod
pm2 restart mapit-ui

# Reset backend
cd ../MAP-IT_SA
docker-compose down
docker-compose up -d

# Reset NGINX
sudo nginx -t
sudo systemctl restart nginx
```

## 13. Support & Resources

### Useful Links
- Supabase Documentation: https://supabase.com/docs
- SvelteKit Documentation: https://kit.svelte.dev/docs
- NGINX Reverse Proxy: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start

### Common Commands Reference
```bash
# Project
npm run dev              # Start development server
npm run build           # Build for production
npm run host            # Deploy with PM2

# PM2
pm2 status              # Show process status
pm2 logs <name>         # Show logs
pm2 restart <name>      # Restart process
pm2 stop <name>         # Stop process

# NGINX
sudo nginx -t           # Test configuration
sudo systemctl restart nginx  # Restart NGINX

# Backend
cd ../MAP-IT_SA && make docker-up     # Start backend
cd ../MAP-IT_SA && docker-compose down  # Stop backend
```

---

**Last Updated**: 2026-05-28
**Version**: 1.0
**Maintainer**: Development Team