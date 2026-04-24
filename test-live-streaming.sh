#!/bin/bash

# Live Streaming Test Script
# This script verifies the live streaming setup

echo "🎥 SESA Academy - Live Streaming Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo "1. Testing Backend Connection..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Run: cd backend && npm run dev"
fi
echo ""

# Test 2: Check if frontend is running
echo "2. Testing Frontend Connection..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo "  Run: cd frontend && npm run dev"
fi
echo ""

# Test 3: Check environment variables
echo "3. Checking Backend Configuration..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Backend .env file exists${NC}"
    
    # Check LiveKit config
    if grep -q "LIVEKIT_API_KEY=" backend/.env && [ -n "$(grep LIVEKIT_API_KEY= backend/.env | cut -d'=' -f2)" ]; then
        echo -e "${GREEN}✓ LiveKit credentials configured${NC}"
        echo "  Mode: LiveKit (Production)"
    else
        echo -e "${YELLOW}⚠ LiveKit not configured${NC}"
        echo "  Mode: P2P WebRTC (Development)"
    fi
else
    echo -e "${RED}✗ Backend .env file missing${NC}"
    echo "  Copy backend/.env.example to backend/.env"
fi
echo ""

# Test 4: Check frontend environment
echo "4. Checking Frontend Configuration..."
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓ Frontend .env file exists${NC}"
else
    echo -e "${YELLOW}⚠ Frontend .env file missing (using defaults)${NC}"
    echo "  Copy frontend/.env.example to frontend/.env"
fi
echo ""

# Test 5: Check dependencies
echo "5. Checking Dependencies..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}✗ Backend dependencies missing${NC}"
    echo "  Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}✗ Frontend dependencies missing${NC}"
    echo "  Run: cd frontend && npm install"
fi
echo ""

# Test 6: Check MongoDB
echo "6. Testing MongoDB Connection..."
if curl -s http://localhost:5000/api/health | grep -q "ok"; then
    echo -e "${GREEN}✓ MongoDB is connected${NC}"
else
    echo -e "${YELLOW}⚠ Cannot verify MongoDB connection${NC}"
    echo "  Make sure MongoDB is running"
fi
echo ""

# Summary
echo "======================================"
echo "📋 Summary"
echo "======================================"
echo ""
echo "To start a live session:"
echo "1. Visit http://localhost:3000/live/sessions"
echo "2. Click 'Schedule New Session'"
echo "3. Fill in the details and create"
echo "4. Click 'Start Session' to go live"
echo ""
echo "Troubleshooting:"
echo "- Check browser console (F12) for errors"
echo "- Ensure camera/mic permissions are granted"
echo "- Review LIVE_STREAMING_SETUP.md for details"
echo ""
