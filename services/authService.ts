interface AuthResponse {
  success: boolean;
  platform: string;
  token?: string;
  error?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export class AuthService {
  /**
   * Connects to a social platform using the backend OAuth server.
   */
  static async connect(platform: 'Instagram' | 'YouTube'): Promise<AuthResponse> {
    return new Promise((resolve) => {
      const endpoint = platform === 'Instagram' 
        ? `${BACKEND_URL}/api/auth/instagram`
        : `${BACKEND_URL}/api/auth/youtube`;

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        endpoint,
        `${platform} OAuth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no`
      );

      if (!popup) {
        resolve({ 
          success: false, 
          platform, 
          error: 'Popup blocked. Please allow popups for this site.' 
        });
        return;
      }

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        // Verify origin for security (adjust in production)
        if (event.origin !== window.location.origin && !event.origin.includes('localhost')) {
          return;
        }

        const { type, platform: responsePlatform, token, error } = event.data;

        if (type === 'AUTH_SUCCESS' && responsePlatform === platform) {
          window.removeEventListener('message', messageHandler);
          resolve({ success: true, platform, token });
        } else if (type === 'AUTH_ERROR' && responsePlatform === platform) {
          window.removeEventListener('message', messageHandler);
          resolve({ success: false, platform, error: error || 'Authentication failed' });
        }
      };

      window.addEventListener('message', messageHandler);

      // Handle popup close without auth
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          resolve({ 
            success: false, 
            platform, 
            error: 'Authentication window closed' 
          });
        }
      }, 500);
    });
  }
}