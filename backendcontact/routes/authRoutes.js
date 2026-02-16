import express from 'express';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const getRedirectUri = (req) => {
  if (process.env.OKTA_REDIRECT_URI && process.env.OKTA_REDIRECT_URI.trim()) {
    return process.env.OKTA_REDIRECT_URI.trim();
  }
  const protocol = req.protocol;
  const host = req.get('host') || '';
  return `${protocol}://${host}/api/v1/auth/okta/callback`;
};

const getFrontendUrl = () => process.env.FRONTEND_URL?.trim() || null;

// Okta issuer may be .../oauth2/default or .../oauth2/v1; we always append /v1/authorize and /v1/token
const getOktaBase = (issuer) =>
  issuer.replace(/\/$/, '').replace(/\/v1$/, '');

// OAuth authorize/token URLs. Use OKTA_OAUTH_BASE when token iss differs (e.g. iss=https://domain, authorize at https://domain/oauth2/v1)
const getOAuthBase = (issuer) => {
  const base = process.env.OKTA_OAUTH_BASE?.trim();
  if (base) return base.replace(/\/$/, '');
  return `${getOktaBase(issuer)}/v1`;
};

/**
 * GET /api/v1/auth/okta/login
 * Redirects the user to Okta to sign in. No auth required.
 */
router.get('/okta/login', (req, res) => {
  const issuer = process.env.OKTA_ISSUER?.trim();
  const clientId = process.env.OKTA_CLIENT_ID?.trim();

  if (!issuer || !clientId) {
    return res.status(503).json({
      error: 'Okta not configured',
      message: 'OKTA_ISSUER and OKTA_CLIENT_ID are required for login.',
    });
  }

  const redirectUri = getRedirectUri(req);
  const state = crypto.randomBytes(16).toString('hex');
  const oauthBase = getOAuthBase(issuer);
  const authorizeUrl = new URL(`${oauthBase}/authorize`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', state);

  res.redirect(authorizeUrl.toString());
});

/**
 * GET /api/v1/auth/okta/callback
 * Okta redirects here with ?code=...&state=... after user signs in.
 * Exchanges code for tokens and redirects to frontend with tokens.
 */
router.get('/okta/callback', async (req, res) => {
  const { code, state, error: oktaError, error_description: oktaErrorDesc } = req.query;

  if (oktaError) {
    const frontendUrl = getFrontendUrl();
    if (!frontendUrl) {
      return res.status(503).json({ error: 'FRONTEND_URL not configured', message: 'Set FRONTEND_URL for redirects.' });
    }
    const errorMsg = oktaErrorDesc || oktaError;
    return res.redirect(`${frontendUrl.replace(/\/$/, '')}/callback?error=${encodeURIComponent(errorMsg)}`);
  }

  if (!code) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing authorization code from Okta.',
    });
  }

  const issuer = process.env.OKTA_ISSUER?.trim();
  const clientId = process.env.OKTA_CLIENT_ID?.trim();
  const clientSecret = process.env.OKTA_CLIENT_SECRET?.trim();

  if (!issuer || !clientId || !clientSecret) {
    return res.status(503).json({
      error: 'Okta not configured',
      message: 'OKTA_ISSUER, OKTA_CLIENT_ID, and OKTA_CLIENT_SECRET are required for callback.',
    });
  }

  const redirectUri = getRedirectUri(req);
  const oauthBase = getOAuthBase(issuer);
  const tokenUrl = `${oauthBase}/token`;

  try {
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', redirectUri);
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);

    const tokenRes = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true,
    });

    if (tokenRes.status !== 200) {
      const errMsg = tokenRes.data?.error_description || tokenRes.data?.error || 'Token exchange failed';
      const frontendUrl = getFrontendUrl();
      if (!frontendUrl) {
        return res.status(503).json({ error: 'FRONTEND_URL not configured', message: 'Set FRONTEND_URL for redirects.' });
      }
      return res.redirect(`${frontendUrl.replace(/\/$/, '')}/callback?error=${encodeURIComponent(errMsg)}`);
    }

    const frontendUrl = getFrontendUrl();
    if (!frontendUrl) {
      return res.status(503).json({ error: 'FRONTEND_URL not configured', message: 'Set FRONTEND_URL for redirects.' });
    }
    const { access_token, refresh_token, id_token, expires_in } = tokenRes.data;
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const redirectTo = new URL(`${baseUrl}/callback`);
    redirectTo.searchParams.set('access_token', access_token);
    if (expires_in) redirectTo.searchParams.set('expires_in', expires_in);
    if (refresh_token) redirectTo.searchParams.set('refresh_token', refresh_token);
    if (id_token) redirectTo.searchParams.set('id_token', id_token);
    if (state) redirectTo.searchParams.set('state', state);

    res.redirect(redirectTo.toString());
  } catch (err) {
    console.error('Okta callback token exchange error:', err.message);
    const frontendUrl = getFrontendUrl();
    if (!frontendUrl) {
      return res.status(503).json({ error: 'FRONTEND_URL not configured', message: 'Set FRONTEND_URL for redirects.' });
    }
    res.redirect(
      `${frontendUrl.replace(/\/$/, '')}/callback?error=${encodeURIComponent(err.response?.data?.error_description || err.message || 'Token exchange failed')}`
    );
  }
});

export default router;
