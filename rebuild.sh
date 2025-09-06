#!/bin/bash

echo "🔄 Rebuilding FamilyVine containers..."

# Change to project directory
cd /c/Users/JWoods/FamilyVine

echo "📦 Building frontend with parent relationship fixes..."
docker-compose build --no-cache frontend

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
    
    echo "🚀 Restarting frontend container..."
    docker-compose up -d frontend
    
    if [ $? -eq 0 ]; then
        echo "✅ Container restart successful"
        echo ""
        echo "🎯 Your combined parent relationship feature is now deployed!"
        echo "   📱 Visit a member page with both parents to test"
        echo "   🔍 Check browser console (F12) for debug messages"
        echo "   🔄 Hard refresh (Ctrl+F5) if you still see the old version"
    else
        echo "❌ Container restart failed"
    fi
else
    echo "❌ Frontend build failed"
fi