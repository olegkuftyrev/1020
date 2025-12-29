# Deployment Guide for Digital Ocean

## Prerequisites

1. SSH access to the server (137.184.225.187)
2. SSH key configured
3. Git repository (optional, for direct deployment)

## Quick Deploy

### Option 1: Using deploy script (from local machine)

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual deployment

#### Step 1: Connect to server

```bash
ssh root@137.184.225.187
```

#### Step 2: Install dependencies on server

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install nginx
apt-get update
apt-get install -y nginx

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib
```

#### Step 3: Clone or upload project

```bash
mkdir -p /var/www/panda-express-dashboard
cd /var/www/panda-express-dashboard

# Option A: Clone from Git
git clone <your-repo-url> .

# Option B: Upload files via SCP/rsync
# From local machine:
# rsync -avz --exclude node_modules ./ root@137.184.225.187:/var/www/panda-express-dashboard/
```

#### Step 4: Setup Backend

```bash
cd /var/www/panda-express-dashboard/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create .env file
cat > .env << EOF
PORT=3333
HOST=0.0.0.0
NODE_ENV=production
APP_KEY=change-me-in-production-use-a-secure-random-key-at-least-32-characters-long
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/panda_express_db?schema=public
AUTH_PASSWORD=123456
EOF

# Setup database
sudo -u postgres psql << EOF
ALTER USER postgres PASSWORD 'your_password';
CREATE DATABASE panda_express_db;
EOF

# Run migrations
npm run prisma:generate
npm run prisma:migrate
```

#### Step 5: Setup Frontend

```bash
cd /var/www/panda-express-dashboard/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

#### Step 6: Configure nginx

```bash
# Copy nginx config
cp /var/www/panda-express-dashboard/nginx.conf /etc/nginx/sites-available/panda-express

# Create symlink
ln -s /etc/nginx/sites-available/panda-express /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx
```

#### Step 7: Start backend with PM2

```bash
cd /var/www/panda-express-dashboard/backend

# Start backend
pm2 start build/server.js --name panda-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Update Frontend API URL

Update `frontend/vite.config.ts` to use production API:

```typescript
export default defineConfig({
  // ... other config
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3333', // This is fine for production build
        changeOrigin: true,
      },
    },
  },
})
```

Or update `frontend/src/stores/authStore.ts`:

```typescript
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'http://137.184.225.187/api' 
    : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})
```

## Firewall Setup

```bash
# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (if using SSL)
ufw allow 443/tcp

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable
```

## SSL/HTTPS Setup (Optional but Recommended)

```bash
# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal
certbot renew --dry-run
```

## Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs panda-backend

# Monitor
pm2 monit

# Check nginx status
systemctl status nginx

# Check nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Backend not starting
```bash
cd /var/www/panda-express-dashboard/backend
pm2 logs panda-backend
# Check for errors in logs
```

### Database connection issues
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
sudo -u postgres psql -d panda_express_db
```

### Frontend not loading
```bash
# Check nginx config
nginx -t

# Check nginx logs
tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/panda-express-dashboard/frontend/dist
```

## Environment Variables

Make sure to set these in `backend/.env`:
- `APP_KEY` - Generate a secure random key (32+ characters)
- `AUTH_PASSWORD` - Your 6-digit PIN
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production`

## Security Notes

1. Change default PostgreSQL password
2. Use strong APP_KEY
3. Set up firewall (ufw)
4. Consider using SSL/HTTPS
5. Keep dependencies updated
6. Use environment variables for secrets


