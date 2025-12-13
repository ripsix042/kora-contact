# Handover Guide - Kora Contacts Hub Backend

This guide will help you set up the project on GitHub and Render for deployment.

## Prerequisites Completed

- [x] Node.js backend structure created
- [x] MongoDB staging database configured
- [x] MongoDB production database configured
- [x] Environment files set up (.env, .env.production)
- [x] Dependencies installed
- [x] Server runs successfully on port 8085

## Step 1: Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial backend setup - Express server with MongoDB connection"
```

## Step 2: Create GitHub Repository

1. Go to GitHub: https://github.com/new
2. Repository name: `kora-contacts-hub-backend` (or your preferred name)
3. Description: "Backend API for Kora Contacts Hub"
4. Visibility: Private (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 3: Connect Local Repository to GitHub

```bash
# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/kora-contacts-hub-backend.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/kora-contacts-hub-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Set Up Render Deployment

### 4.1 Create Render Account
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Authorize Render to access your GitHub repositories

### 4.2 Create Web Service

1. **Click "New +" → "Web Service"**
2. **Connect Repository:**
   - Select your GitHub repository: `kora-contacts-hub-backend`
   - Click "Connect"

3. **Configure Service:**
   - **Name**: `kora-contacts-api-prod` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Set Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add:

   ```env
   NODE_ENV=production
   PORT=8085
   MONGODB_URI=mongodb+srv://Koracontacthubprod:YOUR_PASSWORD@koracontacthubprod.k4qngme.mongodb.net/koracontacthub?retryWrites=true&w=majority&appName=Koracontacthubprod
   JWT_SECRET=your-production-jwt-secret
   JWT_REFRESH_SECRET=your-production-refresh-secret
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   REDIS_URL=redis://your-redis-url (if using)
   CORS_ORIGIN=https://your-frontend-domain.com
   FRONTEND_URL=https://your-frontend-domain.com
   ```

   **Important:** 
   - Replace `YOUR_PASSWORD` with actual MongoDB password
   - Generate new JWT secrets for production (different from staging)
   - Update CORS_ORIGIN and FRONTEND_URL with actual production domains

5. **Click "Create Web Service"**

### 4.3 Create Redis Instance (Optional but Recommended)

1. **Click "New +" → "Redis"**
2. **Configure:**
   - **Name**: `kora-contacts-redis-prod`
   - **Region**: Same as web service
   - **Plan**: Free tier for testing, or paid for production
3. **Copy the Internal Redis URL** and add to `REDIS_URL` environment variable

## Step 5: Configure MongoDB Atlas Network Access

1. Go to MongoDB Atlas → Your Production Project
2. Click "Network Access" (left sidebar)
3. Click "Add IP Address"
4. **For Render:**
   - Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - OR add Render's specific IP addresses if known
5. Click "Confirm"

## Step 6: Verify Deployment

1. **Wait for deployment to complete** (usually 2-5 minutes)
2. **Check service logs** in Render dashboard
3. **Test health endpoint:**
   ```
   https://your-service.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "environment": "production",
     "uptime": ...
   }
   ```

## Step 7: Set Up Auto-Deploy

Render automatically deploys when you push to the connected branch (main).

**To deploy:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Render will automatically:
1. Detect the push
2. Run `npm install`
3. Start the service with `npm start`

## Environment Variables Reference

### Staging/Development (.env)
- Uses: `koracontactstaging.9jtkgbf.mongodb.net`
- Database: `koracontacthub_staging`
- User: `contactsstaging`

### Production (.env.production / Render)
- Uses: `koracontacthubprod.k4qngme.mongodb.net`
- Database: `koracontacthub`
- User: `Koracontacthubprod`

## Important Files

- `.env` - Development/staging config (NOT in git)
- `.env.example` - Template for development (in git)
- `.env.production` - Production config (NOT in git)
- `.env.production.example` - Template for production (in git)
- `package.json` - Dependencies and scripts
- `server.js` - Server entry point
- `app.js` - Express app configuration

## Next Steps for Junior Developer

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in staging MongoDB password
4. Run `npm run dev` to start development server
5. Start building features according to BACKEND_TRD.md

## Troubleshooting

### Deployment Fails
- Check build logs in Render
- Verify all environment variables are set
- Check MongoDB connection string format
- Verify network access in MongoDB Atlas

### MongoDB Connection Errors
- Verify password is correct
- Check network access allows Render IPs
- Ensure cluster is running (not paused)
- Verify connection string format

### Service Crashes
- Check application logs in Render
- Verify all required environment variables are set
- Check MongoDB connection
- Verify Redis connection (if using)

## Support

For questions or issues:
- Check the logs in Render dashboard
- Review MongoDB Atlas connection settings
- Refer to BACKEND_TRD.md for technical requirements

