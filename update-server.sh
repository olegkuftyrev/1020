#!/bin/bash

# Simple server update script
# Updates frontend and backend, restarts services

set -e

SERVER_IP="137.184.225.187"
SERVER_USER="root"
APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "🔄 Updating server..."

# Upload files
echo "📤 Uploading files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'build' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    ./ $SERVER_USER@$SERVER_IP:$APP_DIR/

echo "🔧 Building frontend..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    cd /var/www/panda-express-dashboard/frontend
    npm install --silent
    npm run build
    echo "✅ Frontend built"
ENDSSH

echo "🔧 Building backend..."
ssh -o ConnectTimeout=30 $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    cd /var/www/panda-express-dashboard/backend
    npm install --production --silent
    npm run build
    pm2 restart panda-backend || pm2 start build/server.js --name panda-backend
    pm2 save
    echo "✅ Backend built and restarted"
ENDSSH

echo "🔄 Reloading nginx..."
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "systemctl reload nginx"

echo "✅ Server update complete!"

