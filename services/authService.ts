import { GoogleAuthProvider, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseConfig';

interface AuthResponse {
  success: boolean;
  platform: string;
  token?: string;
  error?: string;
}

export class AuthService {
  /**
   * Connects to a social platform using Firebase Auth.
   */
  static async connect(platform: 'Instagram' | 'YouTube'): Promise<AuthResponse> {
    if (!isFirebaseConfigured()) {
       return { success: false, platform, error: 'Firebase configuration missing.' };
    }

    try {
      let provider;

      if (platform === 'YouTube') {
        provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      } else if (platform === 'Instagram') {
        // Assumes "instagram.com" OIDC or generic OAuth provider is configured in Firebase Console
        provider = new OAuthProvider('instagram.com');
        provider.addScope('user_profile');
        provider.addScope('user_media');
      }

      if (!provider) throw new Error(`Provider for ${platform} not configured`);

      const result = await signInWithPopup(auth, provider);
      
      let token;
      if (platform === 'YouTube') {
         const credential = GoogleAuthProvider.credentialFromResult(result);
         token = credential?.accessToken;
      } else {
         const credential = OAuthProvider.credentialFromResult(result);
         token = credential?.accessToken;
      }

      return { 
        success: true, 
        platform, 
        token: token 
      };

    } catch (error: any) {
      console.error(`${platform} Auth Error:`, error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, platform, error: 'Cancelled by user' };
      }
      
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        return { 
            success: false, 
            platform, 
            error: `The ${platform} sign-in provider is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.` 
        };
      }
      
      return { success: false, platform, error: error.message || 'Authentication failed' };
    }
  }
}