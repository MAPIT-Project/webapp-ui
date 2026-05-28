#!/bin/bash

echo "🔍 MAP-IT Debugging Script"
echo "========================="
echo ""

echo "📊 1. Checking Environment Variables..."
echo "BACKEND_URL: ${BACKEND_URL:-'NOT SET'}"
echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-'NOT SET'}"
echo "PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:-'NOT SET'}"
echo ""

echo "🌐 2. Testing Backend Connection..."
if [ -n "$BACKEND_URL" ]; then
    echo "Testing: $BACKEND_URL/api/health"
    curl -s -w "\nHTTP Status: %{http_code}\n" "$BACKEND_URL/api/health" || echo "❌ Backend connection failed"
else
    echo "❌ BACKEND_URL not set"
fi
echo ""

echo "🧪 3. Testing Local Backend Status API..."
echo "Testing: http://localhost:5173/api/backend-status"
curl -s -w "\nHTTP Status: %{http_code}\n" "http://localhost:5173/api/backend-status" || echo "❌ Local API check failed"
echo ""

echo "🔧 4. Checking Node Process..."
if pgrep -f "node.*build/index.js" > /dev/null; then
    echo "✅ Node process is running"
    pm2 status 2>/dev/null || echo "   (PM2 not available)"
else
    echo "❌ Node process not running"
fi
echo ""

echo "📝 5. Recent PM2 Logs (if available)..."
if command -v pm2 &> /dev/null; then
    pm2 logs --lines 10 --nostream 2>/dev/null || echo "No PM2 logs available"
else
    echo "PM2 not installed"
fi
echo ""

echo "🎯 6. Port Check..."
echo "Checking common ports:"
for port in 3000 5173 8000 18000; do
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ Port $port is in use"
    else
        echo "❌ Port $port is available"
    fi
done
echo ""

echo "📋 7. Browser Console Instructions..."
echo "Open your browser console (F12) and look for:"
echo "  - 🔍 [BackendStatus] prefixed logs"
echo "  - [ConversationPage] prefixed logs"
echo "  - Any red errors"
echo ""

echo "🚀 8. Quick Test Commands..."
echo "Test backend: curl $BACKEND_URL/api/health"
echo "Test local API: curl http://localhost:5173/api/backend-status"
echo "Check PM2: pm2 logs"
echo ""

echo "✅ Debugging complete! Check the output above for issues."