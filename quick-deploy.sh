#!/bin/bash
echo "🔄 Quick rebuild and redeploy..."

cd /mnt/c/Users/JWoods/FamilyVine

echo "📦 Building frontend..."
docker-compose build --no-cache frontend

echo "🚀 Restarting frontend..."
docker-compose up -d frontend

echo "✅ Complete! Check your browser and console logs."