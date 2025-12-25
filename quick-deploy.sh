#!/bin/bash

# Quick deployment script
# This script uploads the project and runs setup on the server

set -e

SERVER_IP="137.184.225.187"
SERVER_USER="root"
APP_DIR="/var/www/panda-express-dashboard"

echo "🚀 Quick Deploy to Digital Ocean"
echo "Server: $SERVER_USER@$SERVER_IP"
echo ""

# Check SSH connection
echo "🔌 Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo 'Connected'" 2>/dev/null; then
    echo "❌ Cannot connect to server. Please check:"
    echo "   1. SSH key is added to server"
    echo "   2. Server is accessible"
    echo "   3. Firewall allows SSH (port 22)"
    exit 1
fi

echo "✅ SSH connection OK"
echo ""

# Upload project
echo "📤 Uploading project files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'build' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    ./ $SERVER_USER@$SERVER_IP:$APP_DIR/

echo ""
echo "🔧 Running setup on server..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    set -e
    APP_DIR="/var/www/panda-express-dashboard"
    BACKEND_DIR="$APP_DIR/backend"
    FRONTEND_DIR="$APP_DIR/frontend"
    
    echo "📦 Installing system dependencies..."
    
    # Update package list
    apt-get update -qq
    
    # Install Node.js if needed
    if ! command -v node &> /dev/null; then
        echo "  Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
        apt-get install -y nodejs > /dev/null 2>&1
    fi
    
    # Install PM2 if needed
    if ! command -v pm2 &> /dev/null; then
        echo "  Installing PM2..."
        npm install -g pm2 > /dev/null 2>&1
    fi
    
    # Install nginx if needed
    if ! command -v nginx &> /dev/null; then
        echo "  Installing nginx..."
        apt-get install -y nginx > /dev/null 2>&1
    fi
    
    # Install PostgreSQL if needed
    if ! command -v psql &> /dev/null; then
        echo "  Installing PostgreSQL..."
        apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
    fi
    
    echo "✅ System dependencies installed"
    echo ""
    
    # Setup backend
    echo "🔧 Setting up backend..."
    cd $BACKEND_DIR
    
    echo "  Installing dependencies..."
    npm install --production > /dev/null 2>&1
    
    echo "  Building TypeScript..."
    npm run build > /dev/null 2>&1
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "  Creating .env file..."
        cat > .env << 'EOF'
PORT=3333
HOST=0.0.0.0
NODE_ENV=production
APP_KEY=change-me-in-production-use-a-secure-random-key-at-least-32-characters-long
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/panda_express_db?schema=public
AUTH_PASSWORD=123456
EOF
        echo "  ⚠️  Please update .env file with your values!"
    fi
    
    # Setup database
    echo "  Setting up database..."
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'changeme';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE panda_express_db;" 2>/dev/null || true
    
    echo "  Generating Prisma client..."
    npm run prisma:generate > /dev/null 2>&1 || true
    
    echo "✅ Backend setup complete"
    echo ""
    
    # Setup frontend
    echo "🔧 Setting up frontend..."
    cd $FRONTEND_DIR
    
    echo "  Installing dependencies..."
    npm install > /dev/null 2>&1
    
    echo "  Building for production..."
    npm run build > /dev/null 2>&1
    
    echo "✅ Frontend setup complete"
    echo ""
    
    # Setup PM2
    echo "🔧 Setting up PM2..."
    cd $BACKEND_DIR
    pm2 delete panda-backend 2>/dev/null || true
    pm2 start build/server.js --name panda-backend
    pm2 save
    
    echo "✅ PM2 setup complete"
    echo ""
    
    # Setup nginx
    echo "🔧 Setting up nginx..."
    if [ -f $APP_DIR/nginx.conf ]; then
        cp $APP_DIR/nginx.conf /etc/nginx/sites-available/panda-express
        ln -sf /etc/nginx/sites-available/panda-express /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t > /dev/null 2>&1 && systemctl reload nginx
        echo "✅ Nginx configured"
    else
        echo "⚠️  nginx.conf not found, skipping nginx setup"
    fi
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update .env file: cd $BACKEND_DIR && nano .env"
    echo "   2. Run migrations: cd $BACKEND_DIR && npm run prisma:migrate"
    echo "   3. Check PM2: pm2 status"
    echo "   4. Check nginx: systemctl status nginx"
    echo "   5. Visit: http://$SERVER_IP"
ENDSSH

echo ""
echo "✅ Deployment finished!"
echo "🌐 Your app should be available at: http://$SERVER_IP"

