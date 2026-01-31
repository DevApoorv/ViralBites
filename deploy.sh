#!/bin/bash

# ViralBites Deployment Script

echo "🚀 Starting ViralBites Deployment..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in to Firebase
echo "🔐 Checking Firebase authentication..."
firebase login:list &> /dev/null || {
    echo "⚠️  Not logged in to Firebase. Please login:"
    firebase login
}

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one from .env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$VITE_API_KEY" ]; then
    echo "❌ VITE_API_KEY not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing function dependencies..."
cd functions
npm install
cd ..

echo ""
echo "🔧 Setting Firebase Functions config..."

# Set Firebase config (only if environment variables are set)
if [ ! -z "$INSTAGRAM_CLIENT_ID" ] && [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    firebase functions:config:set \
      instagram.client_id="$INSTAGRAM_CLIENT_ID" \
      instagram.client_secret="$INSTAGRAM_CLIENT_SECRET" \
      google.client_id="$GOOGLE_CLIENT_ID" \
      google.client_secret="$GOOGLE_CLIENT_SECRET"
    echo "✅ Firebase config updated"
else
    echo "⚠️  OAuth credentials not set. Skipping Firebase config..."
fi

echo ""
echo "🏗️  Building frontend..."
npm run build

echo ""
echo "🚀 Deploying to Firebase..."
firebase deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Get your deployed URL from Firebase Console"
echo "2. Update VITE_BACKEND_URL in .env to: https://YOUR_PROJECT_ID.web.app/api"
echo "3. Add OAuth redirect URIs:"
echo "   - Instagram: https://YOUR_PROJECT_ID.web.app/api/auth/instagram/callback"
echo "   - YouTube: https://YOUR_PROJECT_ID.web.app/api/auth/youtube/callback"
echo "4. Rebuild and redeploy: npm run deploy"
echo ""
