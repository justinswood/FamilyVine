echo "🔄 Starting container rebuild..."

cd "\\JWOODS-DOCKER\\JWoodsDocker\\Users\\JWoods\\FamilyVine"

echo "📦 Building frontend with parent relationship fixes..."
docker-compose build --no-cache frontend

echo "🚀 Restarting frontend container..."
docker-compose up -d frontend

echo "✅ Rebuild complete!"
echo ""
echo "🎯 Test the combined parent relationships now:"
echo "   1. Visit a member page with both parents"
echo "   2. Check browser console (F12) for debug messages"  
echo "   3. Hard refresh (Ctrl+F5) if needed"