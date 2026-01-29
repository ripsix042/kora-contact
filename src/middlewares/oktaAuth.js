// Okta is optional - can be enabled later
let oktaJwtVerifier = null;
let oktaInitialized = false;

// Initialize Okta verifier only if configured
const initializeOkta = async () => {
  if (oktaInitialized) return;
  oktaInitialized = true;

  if (process.env.OKTA_ISSUER && process.env.OKTA_AUDIENCE) {
    try {
      const OktaJwtVerifier = (await import('@okta/jwt-verifier')).default;
      oktaJwtVerifier = new OktaJwtVerifier({
        issuer: process.env.OKTA_ISSUER,
        assertClaims: {
          aud: process.env.OKTA_AUDIENCE,
        },
      });
      console.log('Okta authentication enabled');
    } catch (error) {
      console.warn('Okta JWT verifier not available:', error.message);
    }
  } else {
    console.log('Okta authentication disabled - running in development mode');
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

    // Development mode: If Okta is not configured, use mock user
    if (!oktaJwtVerifier) {
      req.user = {
        oktaSub: 'dev-user-123',
        email: 'dev@korapay.com',
        groups: ['kora-admin', 'kora-ops'],
        scopes: [],
      };
      return next();
    }

    // Production mode: Verify Okta token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      const jwt = await oktaJwtVerifier.verifyAccessToken(token, process.env.OKTA_AUDIENCE);

      // Extract claims
      req.user = {
        oktaSub: jwt.claims.sub,
        email: jwt.claims.email || jwt.claims.sub,
        groups: jwt.claims.groups || [],
        scopes: jwt.claims.scp || [],
      };

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
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

