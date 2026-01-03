#!/bin/bash

# Diagnostic script for 500 Internal Server Error
# Run this on the server to diagnose the issue

set -e

SERVER_IP="137.184.225.187"
SERVER_USER="root"
APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"

echo "🔍 Diagnosing 500 Internal Server Error..."
echo ""

echo "1️⃣ Checking PM2 status..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP "pm2 status" || echo "❌ PM2 not running or command failed"
echo ""

echo "2️⃣ Checking if backend process is running on port 3333..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP "netstat -tlnp | grep 3333 || ss -tlnp | grep 3333 || echo '❌ Port 3333 not listening'" || echo "❌ Could not check port"
echo ""

echo "3️⃣ Checking PM2 logs (last 50 lines)..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP "pm2 logs panda-backend --lines 50 --nostream" || echo "❌ Could not fetch PM2 logs"
echo ""

echo "4️⃣ Checking nginx error logs (last 30 lines)..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP "tail -30 /var/log/nginx/error.log" || echo "❌ Could not fetch nginx error logs"
echo ""

echo "5️⃣ Checking if backend build exists..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP "ls -la $BACKEND_DIR/build/server.js 2>/dev/null || echo '❌ Backend build file not found'" || echo "❌ Could not check build file"
echo ""

echo "6️⃣ Checking nginx configuration..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP "nginx -t 2>&1" || echo "❌ Nginx configuration test failed"
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "💡 Common fixes:"
echo "   - If PM2 process is stopped: cd $BACKEND_DIR && pm2 start build/server.js --name panda-backend"
echo "   - If process is errored: pm2 restart panda-backend"
echo "   - If build is missing: cd $BACKEND_DIR && npm run build"
echo "   - Check logs: pm2 logs panda-backend"

