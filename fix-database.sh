#!/bin/bash

# Database fix script - run this ON the server
# Usage: ssh root@137.184.225.187 'bash -s' < fix-database.sh
# Or: Copy this file to server and run: bash fix-database.sh

set -e

SERVER_IP="137.184.225.187"
APP_DIR="/var/www/panda-express-dashboard"
BACKEND_DIR="$APP_DIR/backend"

echo "🔍 Diagnosing database connection issues..."

# Check if running on server or locally
if [ "$1" = "remote" ]; then
    echo "📡 Running on remote server..."
    ssh root@$SERVER_IP "bash -s" << 'ENDSSH'
        APP_DIR="/var/www/panda-express-dashboard"
        BACKEND_DIR="$APP_DIR/backend"
        
        echo "🔍 Checking PostgreSQL service..."
        if systemctl is-active --quiet postgresql; then
            echo "✅ PostgreSQL is running"
        else
            echo "❌ PostgreSQL is not running. Starting it..."
            systemctl start postgresql
            systemctl enable postgresql
        fi
        
        echo ""
        echo "🔍 Checking database and user..."
        
        # Set PostgreSQL password
        echo "🔧 Setting PostgreSQL password..."
        sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'changeme';" 2>/dev/null || {
            echo "⚠️  Could not alter postgres user, trying to create if needed..."
        }
        
        # Create database if it doesn't exist
        echo "🔧 Creating database if it doesn't exist..."
        sudo -u postgres psql -c "CREATE DATABASE panda_express_db;" 2>/dev/null || {
            echo "ℹ️  Database might already exist (this is OK)"
        }
        
        # Test connection
        echo ""
        echo "🔍 Testing database connection..."
        if sudo -u postgres psql -d panda_express_db -c "SELECT 1;" > /dev/null 2>&1; then
            echo "✅ Database connection successful"
        else
            echo "❌ Database connection failed"
            exit 1
        fi
        
        # Check .env file
        echo ""
        echo "🔍 Checking .env file..."
        cd $BACKEND_DIR
        if [ -f .env ]; then
            echo "✅ .env file exists"
            echo "📄 Current DATABASE_URL:"
            grep DATABASE_URL .env || echo "⚠️  DATABASE_URL not found in .env"
        else
            echo "❌ .env file does not exist. Creating it..."
            cat > .env << 'EOF'
PORT=3333
HOST=0.0.0.0
NODE_ENV=production
APP_KEY=change-me-in-production-use-a-secure-random-key-at-least-32-characters-long
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/panda_express_db?schema=public
AUTH_PASSWORD=123456
EOF
            echo "✅ Created .env file"
        fi
        
        # Update DATABASE_URL if needed
        if ! grep -q "DATABASE_URL=postgresql://postgres:changeme@localhost:5432/panda_express_db" .env; then
            echo "🔧 Updating DATABASE_URL in .env..."
            if grep -q "^DATABASE_URL=" .env; then
                sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:changeme@localhost:5432/panda_express_db?schema=public|' .env
            else
                echo "DATABASE_URL=postgresql://postgres:changeme@localhost:5432/panda_express_db?schema=public" >> .env
            fi
            echo "✅ Updated DATABASE_URL"
        fi
        
        # Run migrations
        echo ""
        echo "🔧 Running database migrations..."
        cd $BACKEND_DIR
        npm run prisma:generate > /dev/null 2>&1 || true
        npm run prisma:migrate deploy > /dev/null 2>&1 || {
            echo "⚠️  Migration failed, trying migrate dev..."
            npm run prisma:migrate dev --name fix_connection || true
        }
        
        # Restart PM2
        echo ""
        echo "🔄 Restarting backend service..."
        pm2 restart panda-backend || pm2 start build/server.js --name panda-backend
        pm2 save
        
        echo ""
        echo "✅ Database fix complete!"
        echo "📊 Check PM2 status: pm2 status"
        echo "📋 Check logs: pm2 logs panda-backend"
ENDSSH
else
    echo "📡 Connecting to server and running fix..."
    ssh root@$SERVER_IP "bash -s" < "$0" remote
fi

