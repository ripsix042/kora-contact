#!/bin/bash

# Cloudflare Tunnel Script for Backend API
# This script starts the backend server and Cloudflare tunnel

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Backend with Cloudflare Tunnel...${NC}"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared is not installed${NC}"
    echo -e "${YELLOW}Install it with: brew install cloudflare/cloudflare/cloudflared${NC}"
    echo -e "${YELLOW}Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/${NC}"
    exit 1
fi

# Check if backend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Backend is already running on port 3000${NC}"
    echo -e "${YELLOW}Starting tunnel only...${NC}"
    echo ""
    cloudflared tunnel --url http://localhost:3000
else
    echo -e "${GREEN}✅ Starting backend server...${NC}"
    echo ""
    
    # Start backend in background
    npm run dev &
    BACKEND_PID=$!
    
    # Wait a bit for backend to start
    sleep 3
    
    # Check if backend started successfully
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo -e "${BLUE}🌐 Starting Cloudflare Tunnel...${NC}"
    echo -e "${YELLOW}📋 Copy the URL below and update your frontend .env file:${NC}"
    echo -e "${YELLOW}   VITE_API_URL=<tunnel-url>${NC}"
    echo ""
    
    # Trap to kill backend when script exits
    trap "kill $BACKEND_PID 2>/dev/null" EXIT
    
    # Start tunnel (this will block)
    cloudflared tunnel --url http://localhost:3000
fi

