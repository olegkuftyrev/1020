#!/bin/bash

# Quick fix script for 500 Internal Server Error
# Attempts to restart backend and nginx

set -e

SERVER_IP="137.184.225.187"
SERVER_USER="root"
APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"

echo "🔧 Attempting to fix 500 Internal Server Error..."
echo ""

echo "1️⃣ Checking PM2 status..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP << 'ENDSSH'
    echo "Current PM2 status:"
    pm2 status
    echo ""
ENDSSH

echo "2️⃣ Restarting backend service..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP << ENDSSH
    set -e
    cd $BACKEND_DIR
    
    # Check if build exists
    if [ ! -f "build/server.js" ]; then
        echo "❌ Build file not found. Building..."
        npm install --production --silent
        npm run build
    fi
    
    # Restart or start PM2 process
    echo "🔄 Restarting PM2 process..."
    pm2 delete panda-backend 2>/dev/null || true
    pm2 start build/server.js --name panda-backend
    pm2 save
    
    # Wait a moment for server to start
    sleep 2
    
    # Check if it's running
    if pm2 list | grep -q "panda-backend.*online"; then
        echo "✅ Backend service is running"
    else
        echo "❌ Backend service failed to start. Check logs: pm2 logs panda-backend"
        exit 1
    fi
ENDSSH

echo ""
echo "3️⃣ Checking if backend is responding on port 3333..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP << 'ENDSSH'
    sleep 1
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/api/auth/verify | grep -q "200\|401\|404"; then
        echo "✅ Backend is responding"
    else
        echo "⚠️  Backend may not be responding correctly"
    fi
ENDSSH

echo ""
echo "4️⃣ Reloading nginx..."
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "systemctl reload nginx && echo '✅ Nginx reloaded'"

echo ""
echo "✅ Fix attempt complete!"
echo ""
echo "📋 Next steps:"
echo "   - Check status: pm2 status"
echo "   - View logs: pm2 logs panda-backend"
echo "   - Test the website in your browser"
echo "   - If still failing, run: ./diagnose-500.sh"

