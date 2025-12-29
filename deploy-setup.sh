#!/bin/bash

# Server setup script - run this ON the server
# Usage: Run this script on Digital Ocean server after initial deployment

set -e

APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "🔧 Setting up Panda Express Dashboard on server..."

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    
    # Setup PostgreSQL
    sudo -u postgres psql << EOF
ALTER USER postgres PASSWORD 'changeme';
CREATE DATABASE panda_express_db;
EOF
fi

# Setup backend
echo "🔧 Setting up backend..."
cd $BACKEND_DIR
npm install
npm run build

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
PORT=3333
HOST=0.0.0.0
NODE_ENV=production
APP_KEY=change-me-in-production-use-a-secure-random-key-at-least-32-characters-long
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/panda_express_db?schema=public
AUTH_PASSWORD=123456
EOF
    echo "✅ Created .env file. Please update it with your values!"
fi

# Setup frontend
echo "🔧 Setting up frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# Setup PM2
echo "🔧 Setting up PM2..."
cd $BACKEND_DIR
pm2 delete panda-backend 2>/dev/null || true
pm2 start build/server.js --name panda-backend
pm2 save
pm2 startup

echo "✅ Server setup complete!"
echo "📝 Don't forget to:"
echo "1. Update .env file in $BACKEND_DIR"
echo "2. Run: cd $BACKEND_DIR && npm run prisma:migrate"
echo "3. Configure nginx (see nginx.conf.example)"


