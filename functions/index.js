const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

admin.initializeApp();

const app = express();

// Enable CORS for all origins (adjust for production)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Get environment config
const config = functions.config();

// --- INSTAGRAM OAUTH ---
const IG_CLIENT_ID = config.instagram?.client_id || process.env.INSTAGRAM_CLIENT_ID;
const IG_CLIENT_SECRET = config.instagram?.client_secret || process.env.INSTAGRAM_CLIENT_SECRET;

app.get('/auth/instagram', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`;
  const scope = 'user_profile,user_media';
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${IG_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  res.redirect(authUrl);
});

app.get('/auth/instagram/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`;
    
    const formData = new URLSearchParams();
    formData.append('client_id', IG_CLIENT_ID);
    formData.append('client_secret', IG_CLIENT_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', formData);
    const accessToken = tokenRes.data.access_token;

    // Send success script to close popup and notify parent
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Successful</title></head>
      <body>
        <h2>Authentication Successful!</h2>
        <p>You can close this window.</p>
        <script>
          window.opener.postMessage({ 
            type: 'AUTH_SUCCESS', 
            platform: 'Instagram', 
            token: '${accessToken}' 
          }, '*');
          setTimeout(() => window.close(), 1000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Instagram Auth Error:', error.response?.data || error.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Failed</title></head>
      <body>
        <h2>Authentication Failed</h2>
        <p>Please try again.</p>
        <script>
          window.opener.postMessage({ 
            type: 'AUTH_ERROR', 
            platform: 'Instagram', 
            error: 'Authentication failed' 
          }, '*');
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `);
  }
});

// --- YOUTUBE (GOOGLE) OAUTH ---
const GOOGLE_CLIENT_ID = config.google?.client_id || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = config.google?.client_secret || process.env.GOOGLE_CLIENT_SECRET;

app.get('/auth/youtube', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
  
  const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.readonly'],
  });
  
  res.redirect(authorizeUrl);
});

app.get('/auth/youtube/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
    
    const oAuth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oAuth2Client.getToken(code);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Successful</title></head>
      <body>
        <h2>Authentication Successful!</h2>
        <p>You can close this window.</p>
        <script>
          window.opener.postMessage({ 
            type: 'AUTH_SUCCESS', 
            platform: 'YouTube', 
            token: '${tokens.access_token}' 
          }, '*');
          setTimeout(() => window.close(), 1000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('YouTube Auth Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Failed</title></head>
      <body>
        <h2>Authentication Failed</h2>
        <p>Please try again.</p>
        <script>
          window.opener.postMessage({ 
            type: 'AUTH_ERROR', 
            platform: 'YouTube', 
            error: 'Authentication failed' 
          }, '*');
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `);
  }
});

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    serverTime: new Date().toISOString(),
    environment: 'firebase-functions'
  });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
