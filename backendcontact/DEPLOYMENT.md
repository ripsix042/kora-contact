# Backend deployment (Render / Okta)

## Fix 401 "Invalid or expired token" on staging

The backend verifies Okta access tokens using **OKTA_ISSUER** and **OKTA_JWKS_URI**. The token’s `iss` claim must **exactly** match `OKTA_ISSUER`. If they differ (e.g. token has `iss: https://login.korapay.com` but Render has `OKTA_ISSUER=https://login.korapay.com/oauth2/v1`), you get 401.

### Required environment variables on Render

Set these in your Render service **Environment** (same values as in `.env` for local):

| Variable | Example | Notes |
|----------|---------|--------|
| `OKTA_ISSUER` | `https://login.korapay.com` | Must match the `iss` claim in the token (no `/oauth2/v1`) |
| `OKTA_OAUTH_BASE` | `https://login.korapay.com/oauth2/v1` | Used for authorize/token URLs only |
| `OKTA_CLIENT_ID` | Your Okta client ID | |
| `OKTA_CLIENT_SECRET` | Your Okta client secret | For OAuth code exchange |
| `OKTA_JWKS_URI` | `https://login.korapay.com/oauth2/v1/keys` | For JWT verification |
| `FRONTEND_URL` | `https://kora-contact-staging.vercel.app` | Staging frontend URL (no trailing slash) |

Do **not** set `OKTA_AUDIENCE` unless you need strict audience checks (can cause 401 if it doesn’t match the token).

### Check Render logs

On token failure the backend logs something like:

```text
Token verification failed: <reason> Token issuer (iss): https://login.korapay.com. Set OKTA_ISSUER to this exact value if different. | Server OKTA_ISSUER: ... | OKTA_JWKS_URI: ...
```

Set `OKTA_ISSUER` on Render to the **Token issuer (iss)** value from that log, then redeploy.
