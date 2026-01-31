<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ViralBites - Discover Trending Food Spots

ViralBites helps you discover viral food places near you by analyzing Instagram Reels, YouTube Shorts, and Google Reviews. The app uses Google's Gemini AI to find trending spots and verifies them with Google Maps data.

View your app in AI Studio: https://ai.studio/apps/drive/1YVnnGHYvvVJnzuSqeCXJweMZNGFc41P0

## Features

- 🔥 Search for viral food trends based on your location and cravings
- 🎥 View Instagram Reels and YouTube Shorts links for each place
- ⭐ See verified Google Maps reviews and ratings
- 📍 Distance calculation from your current location
- 🔐 OAuth integration with Instagram and YouTube for personalized results

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **AI**: Google Gemini API
- **Backend**: Firebase Cloud Functions (Express.js)
- **Hosting**: Firebase Hosting
- **Authentication**: OAuth 2.0 (Instagram & YouTube)

## Prerequisites

- Node.js (v18 or higher)
- Firebase CLI: `npm install -g firebase-tools`
- Google Gemini API Key
- Instagram Developer Account (for OAuth)
- Google Cloud Project with YouTube Data API enabled

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ViralBites
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
VITE_API_KEY=your_google_gemini_api_key_here
VITE_BACKEND_URL=http://localhost:3000

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Google OAuth for YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Getting API Keys:

**Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create or select a project
3. Generate an API key

**Instagram OAuth:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app and add Instagram Basic Display
3. Get Client ID and Client Secret

**YouTube OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs

### 4. Configure Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Hosting
# - Functions
# - Use existing project or create new one
```

### 5. Set Firebase Function Environment Variables

```bash
firebase functions:config:set \
  instagram.client_id="YOUR_INSTAGRAM_CLIENT_ID" \
  instagram.client_secret="YOUR_INSTAGRAM_CLIENT_SECRET" \
  google.client_id="YOUR_GOOGLE_CLIENT_ID" \
  google.client_secret="YOUR_GOOGLE_CLIENT_SECRET"
```

## Running Locally

### Development Mode (with local backend)

1. **Start the backend server** (in one terminal):
```bash
cd server
npm install
npm start
```

2. **Start the frontend** (in another terminal):
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Testing with Firebase Emulators

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start frontend with production backend URL
VITE_BACKEND_URL=http://localhost:5001/YOUR_PROJECT_ID/us-central1/api npm run dev
```

## Deployment

### Deploy to Firebase

```bash
# Build and deploy everything (hosting + functions)
npm run deploy

# Or deploy separately:
npm run build
firebase deploy --only hosting
firebase deploy --only functions
```

### Update Backend URL for Production

After deploying, update your `.env` file:

```env
VITE_BACKEND_URL=https://YOUR_PROJECT_ID.web.app/api
```

Then rebuild and redeploy:

```bash
npm run deploy
```

### Configure OAuth Redirect URIs

After deployment, add these to your OAuth app settings:

**Instagram:**
- `https://YOUR_PROJECT_ID.web.app/api/auth/instagram/callback`

**YouTube/Google:**
- `https://YOUR_PROJECT_ID.web.app/api/auth/youtube/callback`

## Project Structure

```
ViralBites/
├── components/          # React components
│   └── PlaceCard.tsx   # Card component for viral places
├── services/           # Service layer
│   ├── geminiService.ts    # Gemini AI integration
│   ├── authService.ts      # OAuth authentication
│   └── firebaseConfig.ts   # Firebase configuration
├── functions/          # Firebase Cloud Functions
│   ├── index.js        # Backend API endpoints
│   └── package.json    # Backend dependencies
├── server/            # Local development server (optional)
│   └── index.js       # Express server for local testing
├── App.tsx            # Main React component
├── types.ts           # TypeScript type definitions
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
├── firebase.json      # Firebase configuration
└── vite.config.ts     # Vite configuration
```

## Usage

1. **Enable Location**: Click the location button to share your location
2. **Enter Craving**: Type what you're craving (e.g., "spicy ramen", "dessert")
3. **Search**: Click search to find viral spots near you
4. **Connect Accounts** (Optional): Link Instagram/YouTube for personalized results
5. **View Results**: Browse verified places with ratings, distance, and video links

## Troubleshooting

### Gemini API Key Issues
- Make sure your `.env` file has `VITE_API_KEY` (with VITE_ prefix)
- Restart the dev server after changing `.env`

### OAuth Errors
- Verify redirect URIs match in OAuth app settings
- Check that environment variables are set in Firebase Functions
- Ensure popup blockers are disabled

### Firebase Deployment Errors
- Run `firebase login` to ensure you're authenticated
- Check that billing is enabled for Cloud Functions
- Verify all dependencies are installed in `functions/`

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## License

MIT
