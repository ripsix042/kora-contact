# Render MongoDB Setup - Step by Step

## Current Issue
```
MongoDB connection error: bad auth : authentication failed
```

## Step-by-Step Fix

### Step 1: Verify Render Environment Variable

1. Go to **Render Dashboard** → `kora-contact-hub-backend` service
2. Click **"Environment"** tab (left sidebar)
3. Look for `MONGODB_URI` in the list
4. **If it doesn't exist**, click **"Add Environment Variable"**
5. **If it exists**, click **"Edit"**

### Step 2: Set the Correct Connection String

**Key**: `MONGODB_URI`

**Value** (copy exactly, replace password if different):
```
mongodb+srv://Koracontacthubprod:XRGcjn9EYVQFCFrW@koracontacthubprod.k4qngme.mongodb.net/koracontacthub?retryWrites=true&w=majority&appName=Koracontacthubprod
```

**Important:**
- ✅ Include `/koracontacthub` (database name)
- ✅ No quotes around the value
- ✅ No spaces
- ✅ Replace `XRGcjn9EYVQFCFrW` if your password is different

### Step 3: Verify MongoDB Atlas Network Access

1. Go to **MongoDB Atlas** → Your Production Project
2. Click **"Network Access"** (left sidebar)
3. Check if `0.0.0.0/0` is in the list
4. **If NOT present:**
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** button
   - Click **"Confirm"**
   - **Wait 1-2 minutes** for changes to propagate

### Step 4: Verify Database User

1. Go to **MongoDB Atlas** → **"Database Access"**
2. Find user: `Koracontacthubprod`
3. Verify password matches: `XRGcjn9EYVQFCFrW`
4. **If password is different:**
   - Click **"Edit"** on the user
   - Click **"Edit Password"**
   - Set new password
   - Update Render `MONGODB_URI` with new password

### Step 5: Redeploy

1. In Render → **"Events"** tab
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment to complete
4. Check logs for: `MongoDB connected successfully`

## Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority&appName=APP_NAME
```

**Your Production:**
- Username: `Koracontacthubprod`
- Password: `XRGcjn9EYVQFCFrW`
- Cluster: `koracontacthubprod.k4qngme.mongodb.net`
- Database: `koracontacthub` ← **MUST BE INCLUDED**
- App Name: `Koracontacthubprod`

## Common Mistakes

### ❌ Missing Database Name
```
mongodb+srv://...@koracontacthubprod.k4qngme.mongodb.net/?appName=...
```
Should be:
```
mongodb+srv://...@koracontacthubprod.k4qngme.mongodb.net/koracontacthub?appName=...
```

### ❌ Wrong Password
- Password in Render must match password in MongoDB Atlas
- Both are case-sensitive

### ❌ Network Access Not Configured
- MongoDB Atlas blocks all connections by default
- Must add `0.0.0.0/0` in Network Access

### ❌ Quotes in Environment Variable
- ❌ `MONGODB_URI="mongodb+srv://..."`
- ✅ `MONGODB_URI=mongodb+srv://...`

## After Fix - Expected Logs

✅ **Success:**
```
MongoDB URI (masked): mongodb+srv://Koracontacthubprod:****@koracontacthubprod.k4qngme.mongodb.net/koracontacthub?retryWrites=true&w=majority&appName=Koracontacthubprod
MongoDB connected successfully
Database: koracontacthub
```

❌ **Still Failing:**
```
MongoDB connection error: bad auth : authentication failed
Check your MONGODB_URI in Render environment variables
```

## Quick Checklist

- [ ] `MONGODB_URI` is set in Render Environment tab
- [ ] Connection string includes `/koracontacthub` (database name)
- [ ] Password matches MongoDB Atlas (`XRGcjn9EYVQFCFrW`)
- [ ] MongoDB Atlas Network Access has `0.0.0.0/0`
- [ ] No quotes around MONGODB_URI value
- [ ] Service redeployed after changes

