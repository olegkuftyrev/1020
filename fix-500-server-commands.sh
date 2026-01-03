#!/bin/bash

# Commands to run DIRECTLY on the server via SSH
# Usage: ssh root@137.184.225.187 'bash -s' < fix-500-server-commands.sh
# OR: Copy and paste these commands into your SSH session

set -e

APP_DIR="/var/www/panda-express-dashboard"
FRONTEND_DIR="$APP_DIR/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
NGINX_SITE="/etc/nginx/sites-available/panda-express"
NGINX_ENABLED="/etc/nginx/sites-enabled/panda-express"

echo "🔧 Fixing nginx 500 Internal Server Error on server..."
echo ""

echo "1️⃣ Checking if frontend dist directory exists..."
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Dist directory not found: $DIST_DIR"
    echo "🔧 Building frontend..."
    cd $FRONTEND_DIR
    npm install --silent 2>/dev/null || npm install
    npm run build
else
    echo "✅ Dist directory exists"
fi

echo ""
echo "2️⃣ Checking if index.html exists..."
if [ ! -f "$DIST_DIR/index.html" ]; then
    echo "❌ index.html not found. Rebuilding frontend..."
    cd $FRONTEND_DIR
    npm run build
else
    echo "✅ index.html exists"
fi

echo ""
echo "3️⃣ Removing default nginx site if it exists..."
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "4️⃣ Updating nginx configuration..."
cat > $NGINX_SITE << 'NGINXCONF'
server {
    listen 80;
    server_name 137.184.225.187 1020.kuftyrev.cloud;

    # Frontend - fixed to prevent rewrite loop
    location / {
        root /var/www/panda-express-dashboard/frontend/dist;
        try_files $uri $uri/ @fallback;
        index index.html;
    }
    
    # Fallback for SPA routing (prevents rewrite loop)
    location @fallback {
        root /var/www/panda-express-dashboard/frontend/dist;
        try_files /index.html =404;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINXCONF

# Create symlink if it doesn't exist
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s $NGINX_SITE $NGINX_ENABLED
fi

echo "✅ Nginx configuration updated"

echo ""
echo "5️⃣ Testing nginx configuration..."
if nginx -t 2>&1; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

echo ""
echo "6️⃣ Reloading nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

echo ""
echo "7️⃣ Verifying files are accessible..."
if [ -f "$DIST_DIR/index.html" ]; then
    echo "✅ index.html is readable"
    ls -lh "$DIST_DIR/index.html"
else
    echo "❌ index.html still not found!"
    exit 1
fi

echo ""
echo "✅ Fix complete!"
echo ""
echo "📋 Test the website: curl -I http://137.184.225.187"

