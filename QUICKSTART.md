# Quick Start Guide

## Prerequisites Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MongoDB

**Option A: Use Remote MongoDB (MongoDB Atlas or hosted MongoDB)**
- No local installation needed
- Just set `MONGODB_URI` in `.env` to your remote connection string
- Example: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kora-contacts`

**Option B: Install MongoDB Locally**
```bash
# Using Homebrew (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. Setup Redis
```bash
# Using Homebrew (macOS)
brew install redis
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

### 4. Configure Okta (Optional - Can be added later)

**Note:** Okta authentication is optional. If not configured, the server runs in development mode with mock authentication.

**To enable Okta:**

1. Log in to [Okta Admin Console](https://admin.okta.com)
2. Go to **Applications** → **Applications**
3. Create a new **OAuth 2.0 API Service**
4. Note the following:
   - **Issuer URL**: `https://your-domain.okta.com/oauth2/default`
   - **Audience**: Your API identifier (e.g., `api://kora-contacts`)
   - **Client ID**: Your application client ID

5. Configure Groups:
   - Go to **Directory** → **Groups**
   - Create groups: `kora-admin`, `kora-ops`
   - Assign users to groups
   - Ensure groups are included in access token claims:
     - Go to **Security** → **API** → **Authorization Servers**
     - Edit your authorization server
     - Go to **Claims** tab
     - Add a claim for groups:
       - Name: `groups`
       - Value: `groups`
       - Include in: `Access Token`

### 5. Generate Encryption Key
```bash
openssl rand -hex 32
```

### 6. Create .env File
```bash
cp env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/kora-contacts

REDIS_HOST=localhost
REDIS_PORT=6379

# Okta (Optional - leave empty for dev mode)
OKTA_ISSUER=
OKTA_AUDIENCE=
OKTA_CLIENT_ID=

# Encryption Key (Required)
ENCRYPTION_KEY=<paste-generated-key-here>
```

**Note:** If `OKTA_ISSUER` and `OKTA_AUDIENCE` are not set, the server will run in development mode with mock authentication (all users have admin access).

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Testing

### 1. Health Check (No Auth Required)
```bash
curl http://localhost:3000/health
```

### 2. Test API with cURL

**Without Okta (Dev Mode):**
```bash
# Test dashboard (no auth required in dev mode)
curl http://localhost:3000/api/dashboard

# Create a contact
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@korapay.com",
    "phone": "+1234567890"
  }' \
  http://localhost:3000/api/contacts
```

**With Okta (Production Mode):**
```bash
# Set your token
export OKTA_TOKEN="your-access-token"

# Test dashboard
curl -H "Authorization: Bearer $OKTA_TOKEN" \
  http://localhost:3000/api/dashboard

# Create a contact
curl -X POST \
  -H "Authorization: Bearer $OKTA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@korapay.com",
    "phone": "+1234567890"
  }' \
  http://localhost:3000/api/contacts
```

### 3. Run Smoke Tests
```bash
# Without Okta (dev mode)
node test-smoke.js

# With Okta (set token if using)
export OKTA_TOKEN="your-access-token"
node test-smoke.js
```

### 5. Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `postman-collection.json`
4. Set the `okta_token` variable in the collection
5. Start testing!

## Common Issues

### "Missing required Okta configuration"
- This is now optional! If you see a warning, it means Okta is not configured
- The server will run in dev mode with mock authentication
- To enable Okta, set `OKTA_ISSUER` and `OKTA_AUDIENCE` in `.env`

### "ENCRYPTION_KEY must be 32 bytes"
- Generate a new key: `openssl rand -hex 32`
- Ensure it's exactly 64 hex characters

### "MongoDB connection error"
- Ensure MongoDB is running: `brew services list` or `docker ps`
- Check `MONGODB_URI` in `.env`

### "Redis connection error"
- Ensure Redis is running: `brew services list` or `docker ps`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### "401 Unauthorized"
- If using Okta: Verify your Okta token is valid and not expired
- If using Okta: Ensure token includes required groups claim
- If using Okta: Check token audience matches `OKTA_AUDIENCE`
- If not using Okta: This shouldn't happen in dev mode - check server logs

### "403 Forbidden"
- If using Okta: Ensure your Okta user is in the `kora-admin` group (for admin endpoints)
- If using Okta: Verify groups are included in access token claims
- In dev mode: All users have admin access, so this shouldn't occur

## Next Steps

1. Configure CardDAV integration (Settings → CardDAV)
2. Configure Mosyle integration (Settings → Mosyle)
3. Test bulk upload with CSV files
4. Review audit logs in MongoDB

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production MongoDB and Redis
3. Set secure `ENCRYPTION_KEY` (never commit to git)
4. Configure reverse proxy (nginx) with SSL
5. Use process manager (PM2, systemd)
6. Set up monitoring and logging

