#!/bin/bash

# Stop on any error
set -e

echo "🚀 Starting Fluxo Deployment..."

# 1. Install Dependencies
echo "📦 Installing modules..."
npm install

# 2. Build the Project
echo "🏗️  Building..."
npm run build

# 3. Start/Restart with PM2
echo "🔥 Starting Server..."
# Delete existing process if it exists to ensure a fresh start
pm2 delete fluxo 2>/dev/null || true

# Start the app (Assumes 'npm start' runs your production server)
pm2 start npm --name "fluxo" -- start

# Save PM2 list so it restarts on reboot
pm2 save

echo "✅ Deployment Complete! App is running."
