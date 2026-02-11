# Deployment Guide for darrag420.me

## Server Information
- **Domain**: darrag420.me
- **IP**: 197.32.27.73
- **OS**: Ubuntu 20.04.6 LTS
- **Web Server**: Nginx 1.18.0
- **Deployment Path**: ~/project (on server)

## Architecture
- **Frontend**: darrag420.me (Vite production build served by Nginx)
- **Backend**: darrag420.me/api (proxied to localhost:4000)
- **Telegram Bot**: Runs on backend server

---

## Step 1: Upload Project to Server

```bash
# On your local machine
cd /home/darrag/التنزيلات/shada_project/Bloom
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'server/data/*.db*' \
  ./ darrag@darrag420.me:~/project/Bloom/
```

---

## Step 2: Install Dependencies on Server

```bash
# SSH into server
ssh darrag@darrag420.me

# Navigate to project
cd ~/project/Bloom

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install backend dependencies
cd ~/project/Bloom/server
npm install

# Install frontend dependencies
cd ~/project/Bloom/frontend
npm install
```

---

## Step 3: Configure Environment Variables

```bash
# Create backend .env file
cd ~/project/Bloom/server
cat > .env << 'EOF'
PORT=4000
NODE_ENV=production
DB_TYPE=sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
TELEGRAM_BOT_TOKEN=8580242639:AAGZuTEbR3RaOgboQVsNnjs511fGE6aXik8
EOF

# Set proper permissions
chmod 600 .env
```

---

## Step 4: Run Database Migration

```bash
cd ~/project/Bloom/server
npx tsx src/scripts/migrate-telegram.ts
```

---

## Step 5: Build Frontend

```bash
cd ~/project/Bloom/frontend

# Create production .env
cat > .env.production << 'EOF'
VITE_API_BASE=https://darrag420.me/api
VITE_API_BASE_URL=https://darrag420.me/api
EOF

# Build for production
npm run build
```

---

## Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/darrag420.me
```

Paste this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name darrag420.me www.darrag420.me;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name darrag420.me www.darrag420.me;

    # SSL Configuration (update with your certificate paths)
    ssl_certificate /etc/letsencrypt/live/darrag420.me/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/darrag420.me/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend - Vite build
    root /home/darrag/project/Bloom/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API Backend Proxy
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend routing - SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/darrag420.me.access.log;
    error_log /var/log/nginx/darrag420.me.error.log;
}
```

Enable the site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/darrag420.me /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 7: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d darrag420.me -d www.darrag420.me

# Auto-renewal is configured by certbot
# Verify with: sudo certbot renew --dry-run
```

---

## Step 8: Start Backend with PM2

```bash
cd ~/project/Bloom/server

# Start backend
pm2 start src/index.ts --name bloom-backend --interpreter tsx

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it outputs (copy-paste and run with sudo)

# Check status
pm2 status
pm2 logs bloom-backend
```

---

## Step 9: Configure Telegram Bot Webhook (Optional - for production)

If you want to use webhooks instead of polling:

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot8580242639:AAGZuTEbR3RaOgboQVsNnjs511fGE6aXik8/setWebhook" \
  -d "url=https://darrag420.me/api/telegram/webhook"
```

Then update `server/src/services/telegram.service.ts` to use webhook mode instead of polling.

---

## Step 10: Verify Deployment

```bash
# Check backend is running
curl http://localhost:4000/health

# Check from outside
curl https://darrag420.me/api/health

# Check frontend
curl -I https://darrag420.me/

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# View logs
pm2 logs bloom-backend
sudo tail -f /var/log/nginx/darrag420.me.error.log
```

---

## Maintenance Commands

```bash
# Restart backend
pm2 restart bloom-backend

# View logs
pm2 logs bloom-backend --lines 100

# Monitor
pm2 monit

# Update application
cd ~/project/Bloom
git pull
cd server && npm install
cd ../frontend && npm install && npm run build
pm2 restart bloom-backend

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend not accessible
```bash
# Check if backend is running
pm2 status
pm2 logs bloom-backend

# Check if port 4000 is listening
sudo netstat -tlnp | grep :4000

# Restart backend
pm2 restart bloom-backend
```

### Frontend not loading
```bash
# Check Nginx configuration
sudo nginx -t

# Check if build directory exists
ls -la ~/project/Bloom/frontend/dist/

# Rebuild frontend
cd ~/project/Bloom/frontend
npm run build

# Check Nginx logs
sudo tail -f /var/log/nginx/darrag420.me.error.log
```

### Telegram bot not working
```bash
# Check bot token in .env
cat ~/project/Bloom/server/.env | grep TELEGRAM

# Test bot connection
curl "https://api.telegram.org/bot8580242639:AAGZuTEbR3RaOgboQVsNnjs511fGE6aXik8/getMe"

# Check backend logs
pm2 logs bloom-backend | grep -i telegram
```

### Database issues
```bash
# Check database file
ls -la ~/project/Bloom/server/data/bloomhope.db

# Run migration again
cd ~/project/Bloom/server
npx tsx src/scripts/migrate-telegram.ts

# Check database permissions
chmod 644 ~/project/Bloom/server/data/bloomhope.db
```

---

## Security Recommendations

1. **Change JWT Secret**: Update `JWT_SECRET` in `.env` to a strong random value
2. **Firewall**: Configure UFW to only allow necessary ports (80, 443, 22)
3. **Keep Updated**: Regularly update system packages and Node.js
4. **Backup Database**: Setup daily backups of `bloomhope.db`
5. **Monitor Logs**: Setup log rotation and monitoring

```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Setup database backup cron
crontab -e
# Add: 0 2 * * * cp ~/project/Bloom/server/data/bloomhope.db ~/backups/bloomhope-$(date +\%Y\%m\%d).db
```

---

## Environment Variables Reference

### Backend (.env)
```
PORT=4000
NODE_ENV=production
DB_TYPE=sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
TELEGRAM_BOT_TOKEN=8580242639:AAGZuTEbR3RaOgboQVsNnjs511fGE6aXik8
```

### Frontend (.env.production)
```
VITE_API_BASE=https://darrag420.me/api
VITE_API_BASE_URL=https://darrag420.me/api
```

---

## Quick Deploy Script

Save this as `deploy.sh` on the server:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Bloom to darrag420.me..."

# Navigate to project
cd ~/project/Bloom

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Update backend
echo "🔧 Updating backend..."
cd server
npm install
npx tsx src/scripts/migrate-telegram.ts

# Update frontend
echo "🎨 Building frontend..."
cd ../frontend
npm install
npm run build

# Restart services
echo "♻️  Restarting services..."
pm2 restart bloom-backend

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Visit: https://darrag420.me"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs bloom-backend"
```

Make it executable:
```bash
chmod +x ~/project/deploy.sh
```

Run deployment:
```bash
~/project/deploy.sh
```
