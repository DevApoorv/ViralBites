require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const querystring = require('querystring');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Adjust origin to your frontend URL
app.use(express.json());

// --- INSTAGRAM OAUTH ---
const IG_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const IG_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const IG_REDIRECT_URI = `http://localhost:${PORT}/auth/instagram/callback`;

app.get('/auth/instagram', (req, res) => {
  const scope = 'user_profile,user_media';
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${IG_CLIENT_ID}&redirect_uri=${IG_REDIRECT_URI}&scope=${scope}&response_type=code`;
  res.redirect(authUrl);
});

app.get('/auth/instagram/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    // Exchange code for short-lived token
    const formData = new URLSearchParams();
    formData.append('client_id', IG_CLIENT_ID);
    formData.append('client_secret', IG_CLIENT_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', IG_REDIRECT_URI);
    formData.append('code', code);

    const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', formData);
    const accessToken = tokenRes.data.access_token;

    // Send success script to close popup and notify parent
    res.send(`
      <script>
        window.opener.postMessage({ type: 'AUTH_SUCCESS', platform: 'Instagram', token: '${accessToken}' }, '*');
        window.close();
      </script>
    `);
  } catch (error) {
    console.error('IG Auth Error:', error.response?.data || error.message);
    res.status(500).send('Authentication Failed');
  }
});

// --- YOUTUBE (GOOGLE) OAUTH ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `http://localhost:${PORT}/auth/youtube/callback`;

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

app.get('/auth/youtube', (req, res) => {
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
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    res.send(`
      <script>
        window.opener.postMessage({ type: 'AUTH_SUCCESS', platform: 'YouTube', token: '${tokens.access_token}' }, '*');
        window.close();
      </script>
    `);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).send('Authentication Failed');
  }
});

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ViralBites Backend running on http://localhost:${PORT}`);
});