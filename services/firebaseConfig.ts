import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAWCpypjMLVvAH46PqH3loGc9Mon20zUQ",
  authDomain: "viral-bites-617cd.firebaseapp.com",
  projectId: "viral-bites-617cd",
  storageBucket: "viral-bites-617cd.firebasestorage.app",
  messagingSenderId: "1042528075722",
  appId: "1:1042528075722:web:22f7293f035782a8841933",
  measurementId: "G-HW158970K9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional, wrapped in try/catch to prevent blocking if ad-blockers interfere)
let analytics;
try {
    analytics = getAnalytics(app);
} catch (e) {
    console.warn("Firebase Analytics failed to initialize (likely blocked by browser extension)", e);
}

// Initialize Auth
const auth = getAuth(app);

export { auth, app, analytics };

// Helper to check if auth is ready
export const isFirebaseConfigured = () => !!auth;