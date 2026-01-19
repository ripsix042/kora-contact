# Render Deployment Guide

This guide will help you deploy the Kora Contacts Hub Backend to Render.

## Prerequisites

1. GitHub account with repository: `ripsix042/kora-contact`
2. Render account (sign up at https://render.com)
3. MongoDB connection string (Atlas or Render MongoDB)
4. Redis connection details (Render Redis or external)

## Step 1: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Sign in or create an account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select repository: `ripsix042/kora-contact`

3. **Configure Service**
   - **Name**: `kora-contacts-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: (leave empty, root is fine)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid for production)

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable" and add:

   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kora-contacts
   REDIS_HOST=your-redis-host.onrender.com
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   ENCRYPTION_KEY=your-64-character-hex-key
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

   Optional (for Okta):
   ```
   OKTA_ISSUER=https://your-domain.okta.com/oauth2/default
   OKTA_AUDIENCE=api://kora-contacts
   OKTA_CLIENT_ID=your-client-id
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building and deploying
   - First deployment takes 5-10 minutes

### Option B: Using Blueprint (render.yaml)

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and use it
5. Add environment variables in the dashboard (they're marked as `sync: false`)

## Step 2: Set Up MongoDB

### Option A: Use MongoDB Atlas (Recommended)

1. Go to https://cloud.mongodb.com/
2. Create a free cluster
3. Get connection string
4. Add to Render environment variables as `MONGODB_URI`

### Option B: Use Render MongoDB

1. In Render Dashboard, click "New +" → "MongoDB"
2. Choose plan (Free tier available)
3. Copy the connection string
4. Add to your web service's `MONGODB_URI` environment variable

## Step 3: Set Up Redis

### Option A: Use Render Redis

1. In Render Dashboard, click "New +" → "Redis"
2. Choose plan (Free tier available)
3. Copy connection details:
   - Internal Host (for same region)
   - Port
   - Password
4. Add to your web service's environment variables:
   - `REDIS_HOST` (use internal host if in same region)
   - `REDIS_PORT`
   - `REDIS_PASSWORD`

### Option B: Use External Redis

1. Get Redis connection details from your provider
2. Add to environment variables

## Step 4: Generate Encryption Key

If you don't have an encryption key:

```bash
openssl rand -hex 32
```

Add the output to `ENCRYPTION_KEY` environment variable in Render.

## Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```
   https://kora-contacts-backend.onrender.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Logs**
   - Go to Render Dashboard → Your Service → Logs
   - Look for "Server running on port 10000"
   - Check for any errors

3. **Test API**
   ```bash
   curl https://kora-contacts-backend.onrender.com/api/dashboard
   ```

## Step 6: Update Frontend

Update your frontend `.env` file:

```env
VITE_API_URL=https://kora-contacts-backend.onrender.com
```

## Important Notes

### Free Tier Limitations

- **Spin Down**: Services spin down after 15 minutes of inactivity
- **Cold Start**: First request after spin-down takes ~30 seconds
- **Build Time**: Limited build minutes per month
- **Bandwidth**: Limited bandwidth

### Production Recommendations

For production, consider:
- **Paid Plan**: Prevents spin-down, faster response times
- **Custom Domain**: Add your own domain
- **SSL**: Automatically provided by Render
- **Monitoring**: Set up health checks

### Environment Variables

Never commit sensitive values to git. Always set them in Render dashboard:
- `ENCRYPTION_KEY` - Must be 64 hex characters
- `MONGODB_URI` - Your MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis credentials
- `CORS_ORIGIN` - Your frontend URL

### Troubleshooting

**Service won't start:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Check `ENCRYPTION_KEY` is exactly 64 characters

**Connection errors:**
- Verify MongoDB URI is correct
- Check Redis connection details
- Ensure IP whitelisting is configured (for Atlas)

**CORS errors:**
- Update `CORS_ORIGIN` to your frontend URL
- Check that frontend is using correct API URL

**Slow response times:**
- Free tier services spin down after inactivity
- First request after spin-down is slow
- Consider paid plan for production

## Custom Domain (Optional)

1. Go to your service → Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed
4. SSL certificate is automatically provisioned

## Monitoring

- **Logs**: View real-time logs in Render dashboard
- **Metrics**: View CPU, memory, and request metrics
- **Alerts**: Set up alerts for service failures

## Support

- Render Docs: https://render.com/docs
- Render Support: https://render.com/support
