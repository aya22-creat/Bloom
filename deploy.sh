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
