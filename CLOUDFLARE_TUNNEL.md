# Cloudflare Tunnel Setup for Backend API

Quick guide to expose your backend API via Cloudflare Tunnel.

## Quick Start

### Option 1: Use the All-in-One Script (Recommended)

**macOS/Linux:**
```bash
./start-backend-tunnel.sh
```

**Windows (PowerShell):**
```powershell
.\start-backend-tunnel.ps1
```

This script will:
1. ✅ Check if cloudflared is installed
2. ✅ Start your backend server (if not running)
3. ✅ Start Cloudflare tunnel
4. ✅ Show you the tunnel URL to copy

### Option 2: Use npm Scripts

**Start backend and tunnel separately:**
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start tunnel
npm run tunnel
```

**Or use the combined script:**
```bash
npm run dev:tunnel
```

## Setup Steps

1. **Install cloudflared** (if not already installed):
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Or download from:
   # https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Run the tunnel script:**
   ```bash
   ./start-backend-tunnel.sh
   ```

3. **Copy the Cloudflare URL** (e.g., `https://abc-123-def.trycloudflare.com`)

4. **Update frontend `.env` file:**
   ```env
   VITE_API_URL=https://abc-123-def.trycloudflare.com
   ```

5. **Restart your frontend** to pick up the new URL

## Important Notes

- ⚠️ **URL Changes**: The tunnel URL changes each time you restart the tunnel
- ⚠️ **Temporary**: Quick tunnels are temporary and last until you close them
- ✅ **Fast**: Perfect for development and testing
- ✅ **No Config**: No domain or DNS setup needed

## For Production

For a permanent URL, set up a named Cloudflare tunnel with your own domain. See Cloudflare documentation for details.

## Troubleshooting

**Backend already running?**
- The script will detect it and only start the tunnel

**Port 3000 in use?**
- Make sure your backend is running on port 3000
- Or update the script to use a different port

**CORS errors?**
- The backend is configured to allow Cloudflare tunnel URLs automatically
- Make sure your frontend `.env` has the correct tunnel URL

