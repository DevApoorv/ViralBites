import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Values are loaded from environment variables (injected via vite.config.ts define)
const apiKey = process.env.VITE_FIREBASE_API_KEY;

// Check if the API key is valid (not empty and not the default placeholder)
const isConfigValid = apiKey && 
                      apiKey !== 'YOUR_NEW_FIREBASE_API_KEY_HERE' && 
                      !apiKey.includes('YOUR_NEW_FIREBASE_API_KEY');

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let analytics: Analytics | undefined;

if (isConfigValid) {
  try {
    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
      measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Auth
    auth = getAuth(app);

    // Initialize Analytics (optional)
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.warn("Firebase Analytics failed to initialize", e);
    }
  } catch (error) {
    console.warn("Firebase initialization failed (check your .env config):", error);
  }
} else {
    console.warn("Firebase API Key is missing or is a placeholder. Skipping Firebase initialization. App will run in simulation mode.");
}

export { auth, app, analytics };

// Helper to check if auth is ready
export const isFirebaseConfigured = () => !!auth;