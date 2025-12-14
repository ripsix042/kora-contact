# Staging Deployment Setup on Render

## Overview
Set up a separate staging environment on Render that uses the staging MongoDB cluster and the `staging` branch.

## Step 1: Create Staging Web Service on Render

### 1.1 Create New Web Service
1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. **Connect Repository:**
   - Select: `Kora-innovations/kora-contact-hub-backend`
   - Click **"Connect"**

### 1.2 Configure Staging Service
- **Name**: `kora-contacts-api-staging`
- **Region**: Choose closest to your users (can be same as production)
- **Branch**: `staging` ← **Important: Use staging branch**
- **Root Directory**: (leave empty)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` ← **Use npm start, not npm run prod**

### 1.3 Set Staging Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add:

```env
NODE_ENV=staging
PORT=8085
MONGODB_URI=mongodb+srv://contactsstaging:YOUR_STAGING_PASSWORD@koracontactstaging.9jtkgbf.mongodb.net/koracontacthub_staging?retryWrites=true&w=majority&appName=Koracontactstaging
JWT_SECRET=your-staging-jwt-secret-generate-new-one
JWT_REFRESH_SECRET=your-staging-refresh-secret-generate-new-one
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
REDIS_URL=redis://your-staging-redis-url (if using)
CORS_ORIGIN=https://staging.your-domain.com,http://localhost:5173
FRONTEND_URL=https://staging.your-domain.com
```

**Important:**
- Replace `YOUR_STAGING_PASSWORD` with actual staging MongoDB password
- Include `/koracontacthub_staging` (database name) in connection string
- Generate NEW JWT secrets for staging (different from production)
- Update CORS_ORIGIN and FRONTEND_URL for staging frontend

### 1.4 Create Staging Service
Click **"Create Web Service"**

## Step 2: Configure MongoDB Atlas Staging Network Access

1. Go to **MongoDB Atlas** → Your Staging Project
2. Click **"Network Access"** (left sidebar)
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
5. Click **"Confirm"**
6. Wait 1-2 minutes for changes to propagate

## Step 3: Verify Staging Database User

1. Go to **MongoDB Atlas** → **"Database Access"**
2. Find user: `contactsstaging`
3. Verify password matches what's in Render `MONGODB_URI`
4. User should have `readWrite` permissions on `koracontacthub_staging` database

## Step 4: Verify Deployment

After deployment completes, check logs for:
- ✅ `MongoDB connected successfully`
- ✅ `Database: koracontacthub_staging`
- ✅ `Environment: staging`

Test the staging API:
- Health check: `https://kora-contacts-api-staging.onrender.com/health`
- API info: `https://kora-contacts-api-staging.onrender.com/api`

## Staging Connection String Format

```
mongodb+srv://contactsstaging:YOUR_PASSWORD@koracontactstaging.9jtkgbf.mongodb.net/koracontacthub_staging?retryWrites=true&w=majority&appName=Koracontactstaging
```

**Breakdown:**
- Username: `contactsstaging`
- Password: (your staging password)
- Cluster: `koracontactstaging.9jtkgbf.mongodb.net`
- Database: `/koracontacthub_staging` ← **MUST BE INCLUDED**
- App Name: `Koracontactstaging`

## Development Workflow

### Deploy to Staging
```bash
# Make changes
git checkout staging
git add .
git commit -m "Your changes"
git push origin staging
# Staging service auto-deploys
```

### Deploy to Production
```bash
# After testing in staging
git checkout main
git merge staging
git push origin main
# Production service auto-deploys
```

## Service Comparison

| Feature | Staging Service | Production Service |
|---------|----------------|-------------------|
| **Name** | `kora-contacts-api-staging` | `kora-contacts-api-prod` |
| **Branch** | `staging` | `main` |
| **Database** | Staging cluster | Production cluster |
| **Database Name** | `koracontacthub_staging` | `koracontacthub` |
| **JWT Secrets** | Staging secrets | Production secrets (different) |
| **CORS** | Staging frontend URL | Production frontend URL |
| **Environment** | `NODE_ENV=staging` | `NODE_ENV=production` |

## Quick Checklist

- [ ] Staging branch created and pushed to GitHub
- [ ] Staging web service created on Render
- [ ] Branch set to `staging` in Render service settings
- [ ] Start command set to `npm start`
- [ ] `MONGODB_URI` includes `/koracontacthub_staging` (database name)
- [ ] Staging MongoDB password is correct
- [ ] MongoDB Atlas Network Access configured for staging
- [ ] Staging JWT secrets generated (different from production)
- [ ] Service deployed successfully
- [ ] Health check endpoint working

## Troubleshooting

### Staging Uses Production Database
- Check `MONGODB_URI` in Render environment variables
- Verify it points to staging cluster: `koracontactstaging.9jtkgbf.mongodb.net`
- Verify database name: `/koracontacthub_staging`

### Authentication Failed
- Verify staging MongoDB password in Render matches Atlas
- Check MongoDB Atlas Network Access allows `0.0.0/0`
- Verify database user `contactsstaging` exists and has correct password

### Wrong Branch Deployed
- Check Render service settings → Branch should be `staging`
- Verify `staging` branch exists on GitHub
- Redeploy after fixing branch setting

