# MAP-IT Troubleshooting Quick Reference

## 🚨 Critical Issues & Quick Fixes

### Login Works But No Redirect to Dashboard
**Problem**: User can authenticate but doesn't get redirected to `/dashboard`
**Quick Fix**: Check cookie security settings in `src/routes/api/auth/login/+server.ts`:
```typescript
// Line 51 - MUST be true for HTTPS
secure: true, // NOT false!
```

### Mixed Content Errors
**Problem**: Browser blocks requests from HTTPS to HTTP
**Quick Fix**: Update environment variables to use HTTPS/reverse proxy:
```bash
# In .env.production
PUBLIC_SUPABASE_URL="https://mapit.work/supabase"
VITE_SUPABASE_URL="https://mapit.work/supabase"
```

### SSL Protocol Errors  
**Problem**: `ERR_SSL_PROTOCOL_ERROR` when accessing Supabase
**Quick Fix**: Don't use HTTPS with ports - set up NGINX reverse proxy instead

### Backend Connection Refused
**Problem**: `ECONNREFUSED` when trying to stream messages
**Quick Fix**: Start backend service
```bash
cd ../MAP-IT_SA && make docker-up
# Or: docker-compose up -d
```

### Conversation Pages Won't Load
**Problem**: API succeeds but page crashes
**Quick Fix**: Check browser console logs and backend connectivity
```bash
curl http://localhost:18000/api/health
pm2 logs mapit-ui
```

## 🔍 Diagnostic Commands

### 30-Second Health Check
```bash
# 1. Check all services status
pm2 status && sudo systemctl status nginx | head -3

# 2. Test backend connectivity  
curl -s http://localhost:18000/api/health | head -5

# 3. Test Supabase proxy
curl -s https://mapit.work/supabase/rest/v1/ | head -3

# 4. Check recent app logs
pm2 logs mapit-ui --lines 10 --nostream
```

### Detailed Diagnostics
```bash
# Run full diagnostic script
./debug-logs.sh

# Check environment variables
./check-env.sh
```

## 🛠️ Common Repair Procedures

### Fix Authentication Issues
```bash
# 1. Update login endpoint cookie settings
nano src/routes/api/auth/login/+server.ts
# Change: secure: true (line 51)

# 2. Rebuild and restart
cd ~/webapp-ui
pm2 stop mapit-ui
npm run build:prod
pm2 restart mapit-ui

# 3. Test login flow
# Go to https://new.mapit.work/login
```

### Fix Backend Connectivity
```bash
# 1. Check if backend is running
curl http://localhost:18000/api/health

# 2. If not running, start backend
cd ../MAP-IT_SA
make docker-up

# 3. Verify backend
curl http://localhost:18000/api/health
```

### Reset Everything
```bash
# 1. Stop all services
pm2 stop mapit-ui
cd ../MAP-IT_SA && docker-compose down

# 2. Restart services
cd ../MAP-IT_SA && make docker-up
cd ~/webapp-ui && npm run build:prod && pm2 restart mapit-ui

# 3. Verify
pm2 status
curl http://localhost:18000/api/health
```

## 📋 Environment Variable Checklist

### Production Setup (.env.production)
```bash
# Database
PRIVATE_DATABASE_URL="postgresql://user:pass@localhost:54322/db"

# Backend
BACKEND_URL="http://localhost:18000"  # Internal HTTP is fine

# Supabase (HTTPS via reverse proxy)
PUBLIC_SUPABASE_URL="https://mapit.work/supabase"  # MUST be HTTPS
VITE_SUPABASE_URL="https://mapit.work/supabase"    # MUST be HTTPS
PUBLIC_SUPABASE_ANON_KEY="your-key"
```

### Common Mistakes
❌ `PUBLIC_SUPABASE_URL="http://localhost:54321"` (HTTP in production)
❌ `PUBLIC_SUPABASE_URL="https://mapit.work:54321"` (HTTPS with port)
❌ `secure: false` in login endpoint with HTTPS app

✅ `PUBLIC_SUPABASE_URL="https://mapit.work/supabase"` (HTTPS reverse proxy)
✅ `secure: true` in login endpoint with HTTPS app

## 🔧 PM2 Quick Commands

```bash
npm run pm2:logs      # View logs
npm run pm2:stop       # Stop app
npm run pm2:restart   # Restart app
npm run pm2:delete    # Remove from PM2
npm run host           # Build + deploy
```

## 📊 What the Logs Mean

### Browser Console Prefixes
- `[BackendStatus]` - Backend connectivity checks (client-side)
- `[BackendStatusAPI]` - Server-side backend API checks
- `[ConversationPage]` - Page loading and message fetching
- `[SUPABASE CLIENT]` - Supabase initialization

### Server Logs
- `🔍 [BackendStatusAPI]` - Starting backend status check
- `📡 [BackendStatusAPI]` - Making request to backend
- `✅ [BackendStatusAPI]` - Backend reachable
- `❌ [BackendStatusAPI]` - Backend check failed

## 🆘 Emergency Procedures

### App Completely Down
```bash
# 1. Check if processes are running
pm2 status
sudo systemctl status nginx

# 2. Check recent logs
pm2 logs mapit-ui --lines 50
sudo tail -50 /var/log/nginx/error.log

# 3. Restart everything
sudo systemctl restart nginx
pm2 restart mapit-ui

# 4. If still failing, rebuild
cd ~/webapp-ui
pm2 stop mapit-ui
npm run build:prod
pm2 start npm --name mapit-ui -- start
```

### Authentication Completely Broken
```bash
# 1. Check environment variables
cat .env.production | grep SUPABASE

# 2. Verify NGINX config includes Supabase proxy
sudo nginx -t

# 3. Check if Supabase is running
curl https://mapit.work/supabase/rest/v1/

# 4. Check cookie settings in code
grep -r "secure.*false" src/routes/api/auth/
```

## 📞 Support & Escalation

### Before Asking for Help
1. Run `./debug-logs.sh` and save output
2. Check browser console for errors (F12)
3. Get recent PM2 logs: `pm2 logs mapit-ui --lines 50`
4. Check NGINX error logs: `sudo tail -50 /var/log/nginx/error.log`

### Information to Provide
- What you were trying to do
- Exact error messages (browser console + terminal)
- Output of diagnostic commands
- Recent changes made to system

---

**Quick Reference**: Keep this file handy for common issues!
**Full Guide**: See `DEPLOYMENT_GUIDE.md` for complete setup instructions.