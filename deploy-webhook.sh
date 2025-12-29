#!/bin/bash

# Webhook deployment script
# This script is called by the webhook endpoint to update the server

set -e

APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "🔄 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
cd $APP_DIR
git pull origin main || git pull origin master

# Update backend
echo "🔧 Updating backend..."
cd $BACKEND_DIR
npm install
npm run build
pm2 restart panda-backend || pm2 start build/server.js --name panda-backend

# Update frontend
echo "🔧 Updating frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx

echo "✅ Deployment completed successfully!"


