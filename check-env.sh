#!/bin/bash

echo "🔍 Checking environment variables for running process..."
echo "=================================================="

if command -v pm2 &> /dev/null; then
    echo "📊 PM2 Process Environment:"
    pm2 show mapit-ui | grep -A 20 "env:" || echo "No env info available"

    echo ""
    echo "🔍 Checking if there's a .env file being used:"
    pm2 show mapit-ui | grep "env file" || echo "No env file info"
else
    echo "❌ PM2 not available"
fi

echo ""
echo "🌐 Testing what the app is actually using:"
echo "Current .env.production PUBLIC_SUPABASE_URL:"
if [ -f .env.production ]; then
    grep "PUBLIC_SUPABASE_URL" .env.production || echo "Not found in .env.production"
else
    echo ".env.production not found"
fi

echo ""
echo "Current .env PUBLIC_SUPABASE_URL:"
if [ -f .env ]; then
    grep "PUBLIC_SUPABASE_URL" .env || echo "Not found in .env"
else
    echo ".env not found"
fi