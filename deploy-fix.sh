#!/bin/bash
echo "🔄 Rebuilding with parent relationship fix..."

# Navigate to project directory  
cd /mnt/c/Users/JWoods/FamilyVine || exit 1

echo "📦 Building frontend..."
docker-compose build --no-cache frontend

echo "🚀 Restarting frontend..."
docker-compose up -d frontend

echo "✅ Deploy complete!"
echo ""
echo "🎯 Now test with a member who has both mother and father relationships"
echo "📱 Check the browser console for debug messages"
echo "🔄 Try hard refresh (Ctrl+F5) if still seeing old version"