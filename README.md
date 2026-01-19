# Kora Contacts Hub Backend

Production-ready backend for Kora Contacts Hub with Okta SSO authentication.

## Features

- ✅ **Okta Authentication Only** - No local users, no passwords, no custom auth
- ✅ **Group-based Authorization** - kora-admin, kora-ops groups
- ✅ **Contacts Management** - Full CRUD with CardDAV sync
- ✅ **Devices Management** - Full CRUD with Mosyle integration
- ✅ **Bulk Upload** - CSV import for contacts and devices
- ✅ **Dashboard** - Metrics and sync status
- ✅ **Audit Logging** - Complete audit trail with Okta identity
- ✅ **Background Jobs** - BullMQ for async processing

## Prerequisites

- Node.js 18+
- MongoDB
- Redis
- Okta account with configured OAuth2 application

## Okta Setup

1. **Create Okta Application**
   - Log in to Okta Admin Console
   - Create a new OAuth 2.0 API Service
   - Note the Issuer URL and Audience

2. **Configure Groups**
   - Create groups: `kora-admin`, `kora-ops`
   - Assign users to groups
   - Ensure groups are included in access token claims

3. **Get Configuration Values**
   - Issuer URL: `https://your-domain.okta.com/oauth2/default`
   - Audience: Your API identifier (e.g., `api://kora-contacts`)
   - Client ID: Your application client ID

## Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=production
   
   MONGODB_URI=mongodb://localhost:27017/kora-contacts
   
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
   OKTA_AUDIENCE=api://kora-contacts
   OKTA_CLIENT_ID=your-client-id
   
   # Generate with: openssl rand -hex 32
   ENCRYPTION_KEY=your-64-character-hex-key
   ```

3. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod
   
   # Redis
   redis-server
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

All endpoints require Okta Bearer token in Authorization header:
```
Authorization: Bearer <okta-access-token>
```

### Contacts
- `GET /api/contacts` - List contacts (with pagination, search)
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Devices
- `GET /api/devices` - List devices (with pagination, search, status filter)
- `GET /api/devices/:id` - Get device by ID
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Dashboard
- `GET /api/dashboard` - Get dashboard metrics (cached)

### Settings (Admin Only)
- `GET /api/settings/integrations` - Get integration settings
- `PUT /api/settings/integrations/carddav` - Update CardDAV settings
- `PUT /api/settings/integrations/mosyle` - Update Mosyle settings
- `POST /api/settings/integrations/:type/sync` - Trigger manual sync

### Bulk Upload (Admin Only)
- `POST /api/bulk-upload/contacts` - Upload contacts CSV
- `POST /api/bulk-upload/devices` - Upload devices CSV

### Health Check
- `GET /health` - Health check (no auth required)

## Authorization

- **All endpoints** require valid Okta token
- **Admin endpoints** (settings, bulk upload) require `kora-admin` group
- **Operations endpoints** can use `kora-ops` group (if implemented)

## CSV Upload Format

### Contacts CSV
```csv
name,email,phone,company,title,notes
John Doe,john.doe@korapay.com,+1234567890,Acme Inc,Manager,Important contact
```

### Devices CSV
```csv
name,serialNumber,model,osVersion,status
iPhone 13,ABC123XYZ,iPhone 13,iOS 17.0,available
```

## Testing with Postman

1. **Get Okta Access Token**
   - Use Okta's token endpoint or your frontend
   - Token must include groups claim

2. **Configure Postman**
   - Add header: `Authorization: Bearer <token>`
   - Set base URL: `http://localhost:3000`

3. **Test Endpoints**
   - Start with `/health` (no auth)
   - Then test `/api/dashboard` (requires auth)
   - Test CRUD operations

## Security Features

- ✅ Okta JWT verification
- ✅ Group-based access control
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Encrypted API key storage
- ✅ Audit logging

## Error Handling

All errors follow standard format:
```json
{
  "error": "ErrorName",
  "message": "Human-readable message"
}
```

## Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB and Redis
3. Set secure `ENCRYPTION_KEY` (32 bytes hex)
4. Configure Okta production settings
5. Use process manager (PM2, systemd, etc.)
6. Set up reverse proxy (nginx) with SSL

## Development

```bash
# Lint
npm run lint

# Format
npm run format

# Development mode with auto-reload
npm run dev
```

## Architecture

```
src/
├── config/          # Database, Redis, queue config
├── controllers/     # Request handlers
├── middlewares/     # Auth, security, error handling
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── services/        # Business logic
├── utils/           # Utilities (encryption, audit)
├── workers/         # Background job workers
└── server.js        # Application entry point
```

## Acceptance Criteria

✅ Requests without Okta token → 401  
✅ Expired token → 401  
✅ Wrong audience → 401  
✅ Non-admin group blocked from admin endpoints  
✅ Actor identity logged correctly in audit logs  
✅ No user data stored in backend  
✅ No password handling  
✅ No custom JWT issuance  

## License

ISC

# kora-contact
