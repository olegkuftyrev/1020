#!/bin/bash

# Deploy script for Digital Ocean
# Usage: ./deploy.sh

set -e

SERVER_IP="137.184.225.187"
SERVER_USER="root"
APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "🚀 Starting deployment to Digital Ocean..."

# Check if SSH key is available
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "❌ No SSH key found. Please generate one with: ssh-keygen"
    exit 1
fi

# Add server to known_hosts if not present
ssh-keyscan -H $SERVER_IP >> ~/.ssh/known_hosts 2>/dev/null || true

echo "📦 Creating deployment package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
cd "$(dirname "$0")"

# Copy project files
echo "📋 Copying files..."
rsync -avz --exclude 'node_modules' \
           --exclude '.git' \
           --exclude 'dist' \
           --exclude 'build' \
           --exclude '.env' \
           --exclude '*.log' \
           ./ "$TEMP_DIR/"

echo "📤 Uploading to server..."
# Upload to server
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << EOF
    set -e
    mkdir -p $APP_DIR
EOF

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    "$TEMP_DIR/" $SERVER_USER@$SERVER_IP:$APP_DIR/

# Cleanup
rm -rf "$TEMP_DIR"

echo "🔧 Setting up server..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    APP_DIR="/var/www/panda-express-dashboard"
    BACKEND_DIR="$APP_DIR/backend"
    FRONTEND_DIR="$APP_DIR/frontend"
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        echo "📦 Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        echo "📦 Installing PM2..."
        npm install -g pm2
    fi
    
    # Install nginx if not present
    if ! command -v nginx &> /dev/null; then
        echo "📦 Installing nginx..."
        apt-get update
        apt-get install -y nginx
    fi
    
    # Install PostgreSQL if not present
    if ! command -v psql &> /dev/null; then
        echo "📦 Installing PostgreSQL..."
        apt-get install -y postgresql postgresql-contrib
    fi
    
    # Setup backend
    echo "🔧 Setting up backend..."
    cd $BACKEND_DIR
    npm install --production
    npm run build
    
    # Setup frontend
    echo "🔧 Setting up frontend..."
    cd $FRONTEND_DIR
    npm install
    npm run build
    
    echo "✅ Setup complete!"
ENDSSH

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. SSH to server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Create .env file in $BACKEND_DIR with your configuration"
echo "3. Run: cd $BACKEND_DIR && npm run prisma:migrate"
echo "4. Start services with PM2 or systemd"


