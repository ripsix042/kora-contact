/**
 * Okta JWT verification middleware.
 * Uses: OKTA_ISSUER, OKTA_CLIENT_ID, OKTA_AUDIENCE (optional), OKTA_JWKS_URI (optional).
 * When token iss is e.g. https://domain but signing keys are at .../oauth2/v1/keys, set OKTA_JWKS_URI
 * to that URL (e.g. https://login.korapay.com/oauth2/v1/keys) to verify using those keys.
 */
let oktaJwtVerifier = null;
let jwksClient = null;
let oktaInitialized = false;

// Audience for JWT verification. Okta access tokens may have aud = api://default, client_id, or custom.
const getAudience = () => {
  const aud = process.env.OKTA_AUDIENCE?.trim() || process.env.OKTA_CLIENT_ID?.trim();
  return aud || 'api://default';
};

// Okta is enabled when issuer and client ID are set (same as login flow). Client secret is only needed in authRoutes.
const isOktaConfigured = () =>
  Boolean(process.env.OKTA_ISSUER?.trim() && process.env.OKTA_CLIENT_ID?.trim());

const initializeOkta = async () => {
  if (oktaInitialized) return;
  oktaInitialized = true;

  if (isOktaConfigured()) {
    const jwksUri = process.env.OKTA_JWKS_URI?.trim();
    if (jwksUri) {
      try {
        const jwksRsa = (await import('jwks-rsa')).default;
        jwksClient = jwksRsa({ jwksUri, cache: true, rateLimit: true });
        console.log('Okta authentication enabled (OKTA_ISSUER, OKTA_JWKS_URI)');
      } catch (error) {
        console.warn('JWKS client not available:', error.message);
      }
    }
    if (!jwksClient) {
      try {
        const OktaJwtVerifier = (await import('@okta/jwt-verifier')).default;
        const issuer = process.env.OKTA_ISSUER.trim();
        const audience = getAudience();
        oktaJwtVerifier = new OktaJwtVerifier({
          issuer,
          assertClaims: { aud: audience },
        });
        console.log('Okta authentication enabled (OKTA_ISSUER, OKTA_CLIENT_ID)');
      } catch (error) {
        console.warn('Okta JWT verifier not available:', error.message);
      }
    }
  } else {
    console.log('Okta authentication disabled - set OKTA_ISSUER and OKTA_CLIENT_ID to enable');
  }
};

// Initialize on first import
initializeOkta();

/**
 * Middleware to verify Okta access token (or use dev mode)
 * Extracts user claims (sub, email, groups) and attaches to req.user
 */
export const verifyOktaToken = async (req, res, next) => {
  try {
    // Ensure Okta is initialized
    await initializeOkta();

    // Development mode: If no verifier available, use mock user
    if (!oktaJwtVerifier && !jwksClient) {
      req.user = {
        oktaSub: 'dev-user-123',
        email: 'dev@korapay.com',
        groups: ['kora-admin', 'kora-ops'],
        scopes: [],
      };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      let claims;

      if (jwksClient) {
        // Verify using custom JWKS URI (issuer may not expose keys at /.well-known)
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded?.header?.kid) {
          throw new Error('Token missing kid in header');
        }
        const key = await jwksClient.getSigningKey(decoded.header.kid);
        const signingKey = key.getPublicKey();
        const issuer = process.env.OKTA_ISSUER?.trim();
        const verifyOptions = { algorithms: ['RS256'], issuer: issuer || undefined };
        const aud = process.env.OKTA_AUDIENCE?.trim();
        if (aud) verifyOptions.audience = aud;
        const verified = jwt.verify(token, signingKey, verifyOptions);
        claims = verified;
      } else {
        const jwt = await oktaJwtVerifier.verifyAccessToken(token, getAudience());
        claims = jwt.claims;
      }

      req.user = {
        oktaSub: claims.sub,
        email: claims.email || claims.sub,
        groups: claims.groups || [],
        scopes: claims.scp || [],
      };

      next();
    } catch (error) {
      // When "resolving signing key for kid" fails, the token's issuer may not match OKTA_ISSUER
      let hint = '';
      try {
        const payloadB64 = token.split('.')[1];
        if (payloadB64) {
          const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
          if (payload.iss) {
            hint = ` Token issuer (iss): ${payload.iss}. Set OKTA_ISSUER to this exact value if different.`;
          }
        }
      } catch (_) {}
      const serverIssuer = process.env.OKTA_ISSUER?.trim() || '(not set)';
      const serverJwks = process.env.OKTA_JWKS_URI?.trim() ? 'set' : '(not set)';
      console.error(
        'Token verification failed:',
        error.message,
        hint,
        '| Server OKTA_ISSUER:',
        serverIssuer,
        '| OKTA_JWKS_URI:',
        serverJwks
      );
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware to require specific Okta group membership
 */
export const requireGroup = (requiredGroup) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userGroups = req.user.groups || [];

    if (!userGroups.includes(requiredGroup)) {
      console.warn(
        `Access denied: User ${req.user.email} (${req.user.oktaSub}) lacks group: ${requiredGroup}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required group: ${requiredGroup}`,
      });
    }

    next();
  };
};

/**
 * Middleware to require admin group (kora-admin)
 */
export const requireAdmin = requireGroup('kora-admin');

