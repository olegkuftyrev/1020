#!/bin/bash

# Fix nginx 403 Forbidden permissions issue
# Usage: ssh root@137.184.225.187 'bash -s' < fix-nginx-permissions.sh
# Or: Copy this file to server and run: bash fix-nginx-permissions.sh

set -e

SERVER_IP="137.184.225.187"
APP_DIR="/var/www/panda-express-dashboard"
FRONTEND_DIR="$APP_DIR/frontend"
DIST_DIR="$FRONTEND_DIR/dist"

echo "🔧 Fixing nginx permissions for 403 Forbidden error..."

# Check if running on server or locally
if [ "$1" = "remote" ]; then
    echo "📡 Running on remote server..."
    ssh root@$SERVER_IP "bash -s" << 'ENDSSH'
        APP_DIR="/var/www/panda-express-dashboard"
        FRONTEND_DIR="$APP_DIR/frontend"
        DIST_DIR="$FRONTEND_DIR/dist"
        
        echo "🔍 Checking directory structure..."
        
        # Check if directories exist
        if [ ! -d "$APP_DIR" ]; then
            echo "❌ App directory does not exist: $APP_DIR"
            echo "⚠️  Please run deployment first"
            exit 1
        fi
        
        if [ ! -d "$FRONTEND_DIR" ]; then
            echo "❌ Frontend directory does not exist: $FRONTEND_DIR"
            exit 1
        fi
        
        if [ ! -d "$DIST_DIR" ]; then
            echo "⚠️  Dist directory does not exist: $DIST_DIR"
            echo "🔧 Building frontend..."
            cd $FRONTEND_DIR
            npm install 2>/dev/null || echo "⚠️  npm install may have issues, continuing..."
            npm run build || {
                echo "❌ Frontend build failed"
                exit 1
            }
        fi
        
        # Check if dist directory has files
        if [ ! -f "$DIST_DIR/index.html" ]; then
            echo "⚠️  index.html not found in dist. Rebuilding..."
            cd $FRONTEND_DIR
            npm run build || {
                echo "❌ Frontend build failed"
                exit 1
            }
        fi
        
        echo ""
        echo "🔧 Setting correct permissions..."
        
        # Set ownership to root:root (nginx can read without ownership)
        chown -R root:root $APP_DIR
        
        # Set directory permissions: 755 (rwxr-xr-x) - owner can read/write/execute, others can read/execute
        find $APP_DIR -type d -exec chmod 755 {} \;
        
        # Set file permissions: 644 (rw-r--r--) - owner can read/write, others can read
        find $APP_DIR -type f -exec chmod 644 {} \;
        
        # Make scripts executable
        find $APP_DIR -name "*.sh" -exec chmod 755 {} \;
        
        echo "✅ Permissions set"
        
        echo ""
        echo "🔍 Verifying nginx can access files..."
        
        # Check if nginx user can read the directory
        if sudo -u www-data test -r "$DIST_DIR" && sudo -u www-data test -x "$DIST_DIR"; then
            echo "✅ nginx can read and traverse dist directory"
        else
            echo "⚠️  nginx cannot access dist directory, adjusting permissions..."
            # Give read and execute to others
            chmod -R o+rX $DIST_DIR
        fi
        
        # Verify index.html is readable
        if sudo -u www-data test -r "$DIST_DIR/index.html"; then
            echo "✅ nginx can read index.html"
        else
            echo "❌ nginx cannot read index.html"
            chmod 644 "$DIST_DIR/index.html"
        fi
        
        echo ""
        echo "🔍 Checking nginx configuration..."
        
        # Check if nginx config exists
        if [ -f "/etc/nginx/sites-available/panda-express" ]; then
            echo "✅ nginx config file exists"
        else
            echo "⚠️  nginx config not found. Creating it..."
            if [ -f "$APP_DIR/nginx.conf" ]; then
                cp $APP_DIR/nginx.conf /etc/nginx/sites-available/panda-express
                ln -sf /etc/nginx/sites-available/panda-express /etc/nginx/sites-enabled/panda-express
                rm -f /etc/nginx/sites-enabled/default
            else
                echo "❌ nginx.conf not found in $APP_DIR"
            fi
        fi
        
        # Test nginx configuration
        echo ""
        echo "🔍 Testing nginx configuration..."
        if nginx -t 2>&1; then
            echo "✅ nginx configuration is valid"
            echo "🔄 Reloading nginx..."
            systemctl reload nginx
            echo "✅ nginx reloaded"
        else
            echo "❌ nginx configuration has errors"
            exit 1
        fi
        
        echo ""
        echo "📊 Directory listing of dist:"
        ls -lah $DIST_DIR | head -10
        
        echo ""
        echo "✅ Permission fix complete!"
        echo "📝 If you still get 403, check:"
        echo "   - nginx error logs: tail -f /var/log/nginx/error.log"
        echo "   - File permissions: ls -la $DIST_DIR"
        echo "   - SELinux status: getenforce (if enabled, may need: setsebool -P httpd_read_user_content 1)"
ENDSSH
else
    echo "📡 Connecting to server and running fix..."
    ssh root@$SERVER_IP "bash -s" < "$0" remote
fi

