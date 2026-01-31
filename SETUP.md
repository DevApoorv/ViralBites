# ViralBites Quick Setup Guide

## 🎯 Overview
ViralBites searches for viral food trends on Instagram Reels and YouTube Shorts, verifies them with Google Maps, and shows you the best spots near you.

## 📋 Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Google Gemini API Key
- [ ] Instagram Developer Account (Optional - for OAuth)
- [ ] Google Cloud Project with YouTube API (Optional - for OAuth)

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
cd functions && npm install && cd ..
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
VITE_API_KEY=your_gemini_api_key_here
```

### 3. Run Locally
```bash
# Terminal 1: Start backend
cd server && npm start

# Terminal 2: Start frontend
npm run dev
```

Open http://localhost:5173

## 🔐 Setting Up OAuth (Optional - For Instagram/YouTube Integration)

### Instagram OAuth Setup

1. Go to https://developers.facebook.com/
2. Create a new app
3. Add "Instagram Basic Display" product
4. In "Instagram Basic Display" settings:
   - Add OAuth Redirect URI: `http://localhost:3000/api/auth/instagram/callback`
   - Copy Client ID and Client Secret
5. Add to `.env`:
   ```env
   INSTAGRAM_CLIENT_ID=your_client_id
   INSTAGRAM_CLIENT_SECRET=your_client_secret
   ```

### YouTube OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 Client ID (Web application)
5. Add Authorized redirect URI: `http://localhost:3000/api/auth/youtube/callback`
6. Copy Client ID and Client Secret
7. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## ☁️ Firebase Deployment

### Initial Setup
```bash
firebase login
firebase init
# Select: Hosting, Functions
# Use: dist folder for hosting
# Use: functions folder for functions
```

### Configure Firebase Functions
```bash
firebase functions:config:set \
  instagram.client_id="YOUR_INSTAGRAM_CLIENT_ID" \
  instagram.client_secret="YOUR_INSTAGRAM_CLIENT_SECRET" \
  google.client_id="YOUR_GOOGLE_CLIENT_ID" \
  google.client_secret="YOUR_GOOGLE_CLIENT_SECRET"
```

### Deploy
```bash
# Option 1: Use deploy script
./deploy.sh

# Option 2: Manual deployment
npm run build
firebase deploy
```

### Post-Deployment Configuration

1. Get your Firebase project URL (e.g., `https://viral-bites-617cd.web.app`)

2. Update `.env`:
   ```env
   VITE_BACKEND_URL=https://YOUR_PROJECT_ID.web.app/api
   ```

3. Update OAuth redirect URIs:
   - **Instagram**: Add `https://YOUR_PROJECT_ID.web.app/api/auth/instagram/callback`
   - **YouTube**: Add `https://YOUR_PROJECT_ID.web.app/api/auth/youtube/callback`

4. Rebuild and redeploy:
   ```bash
   npm run deploy
   ```

## 🧪 Testing

### Test Local Setup
```bash
# In one terminal
cd server && npm start

# In another terminal
npm run dev

# Open http://localhost:5173
# Click location button
# Enter a food craving (e.g., "pizza")
# Click search
```

### Test Firebase Functions
```bash
firebase emulators:start
# Test at http://localhost:5001
```

### Test OAuth Flow
1. Run the app locally or on Firebase
2. Click "Settings" icon
3. Click "Connect Instagram" or "Connect YouTube"
4. Complete OAuth flow
5. Check browser console for token

## 🔍 Troubleshooting

### "API Key not found" Error
- Ensure `.env` has `VITE_API_KEY` (not `API_KEY`)
- Restart dev server after changing `.env`
- Check browser console for the error

### OAuth Popup Blocked
- Allow popups in browser settings
- Try disabling popup blocker temporarily

### Firebase Deployment Fails
- Ensure billing is enabled (required for Cloud Functions)
- Check `firebase-debug.log` for details
- Verify all dependencies are installed in `functions/`

### No Results Found
- Ensure location permissions are granted
- Try a more specific search (e.g., "spicy tacos" instead of "food")
- Check Gemini API quota/limits

### Backend Connection Failed
- Verify `VITE_BACKEND_URL` in `.env`
- Check if backend server is running
- Check browser network tab for CORS errors

## 📊 Usage Limits

### Gemini API (Free Tier)
- 15 requests per minute
- 1,500 requests per day
- Consider upgrading for production

### Firebase (Spark Plan - Free)
- 125K function invocations/month
- 1GB hosting storage
- 10GB hosting transfer

## 🎨 Customization

### Change Search Radius
Edit [services/geminiService.ts](services/geminiService.ts#L290):
```typescript
if (distanceNum > 20) return null; // Change 20 to your desired radius in km
```

### Add More Platforms
1. Add OAuth provider in [functions/index.js](functions/index.js)
2. Update [services/authService.ts](services/authService.ts)
3. Update [App.tsx](App.tsx) settings UI

### Modify AI Prompts
Edit [services/geminiService.ts](services/geminiService.ts#L100) to customize search behavior

## 📚 Additional Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [YouTube Data API](https://developers.google.com/youtube/v3)

## 🆘 Getting Help

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Review browser console for errors
- Check Firebase Functions logs: `firebase functions:log`
- Enable verbose logging in [services/geminiService.ts](services/geminiService.ts)

## 🎉 You're All Set!

Your ViralBites app should now be running. Try searching for:
- "viral dessert"
- "spicy ramen"
- "instagram worthy cafe"
- "trending burgers"

Happy eating! 🍔🍕🍜
