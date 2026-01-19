# Cloudflare Tunnel Script for Backend API (PowerShell)
# This script starts the backend server and Cloudflare tunnel

Write-Host "🚀 Starting Backend with Cloudflare Tunnel..." -ForegroundColor Blue
Write-Host ""

# Check if cloudflared is installed
try {
    $null = Get-Command cloudflared -ErrorAction Stop
} catch {
    Write-Host "❌ cloudflared is not installed" -ForegroundColor Red
    Write-Host "Install it from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
    exit 1
}

# Check if backend is already running on port 3000
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Backend is already running on port 3000" -ForegroundColor Yellow
    Write-Host "Starting tunnel only..." -ForegroundColor Yellow
    Write-Host ""
    cloudflared tunnel --url http://localhost:3000
} else {
    Write-Host "✅ Starting backend server..." -ForegroundColor Green
    Write-Host ""
    
    # Start backend in background
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    
    # Wait a bit for backend to start
    Start-Sleep -Seconds 3
    
    Write-Host "✅ Backend started" -ForegroundColor Green
    Write-Host "🌐 Starting Cloudflare Tunnel..." -ForegroundColor Blue
    Write-Host "📋 Copy the URL below and update your frontend .env file:" -ForegroundColor Yellow
    Write-Host "   VITE_API_URL=<tunnel-url>" -ForegroundColor Yellow
    Write-Host ""
    
    # Start tunnel (this will block)
    cloudflared tunnel --url http://localhost:3000
    
    # Cleanup job when script exits
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
}

