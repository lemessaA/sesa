#!/bin/bash

# SESA Academy - Quick Login Fix Script
# This script sets up local development environment for testing login

set -e

echo "🚀 SESA Academy - Quick Login Fix"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update frontend .env
echo -e "${BLUE}Step 1: Updating frontend/.env${NC}"
if [ -f "frontend/.env" ]; then
    echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
    echo -e "${GREEN}✓ frontend/.env updated${NC}"
else
    echo -e "${YELLOW}⚠ frontend/.env not found${NC}"
fi
echo ""

# Step 2: Check if backend is running
echo -e "${BLUE}Step 2: Checking backend...${NC}"
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not running${NC}"
    echo "   Start it with: cd backend && npm run dev"
fi
echo ""

# Step 3: Check if MongoDB is running
echo -e "${BLUE}Step 3: Checking MongoDB...${NC}"
if curl -s http://localhost:27017 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB is not running${NC}"
    echo "   Start it with: brew services start mongodb-community"
    echo "   Or with Docker: docker run -d -p 27017:27017 mongo"
fi
echo ""

# Step 4: Install dependencies
echo -e "${BLUE}Step 4: Installing dependencies...${NC}"
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
echo ""

# Step 5: Summary
echo -e "${GREEN}=================================="
echo "✓ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "${BLUE}Terminal 1 - Start Backend:${NC}"
echo "  cd backend && npm run dev"
echo ""
echo -e "${BLUE}Terminal 2 - Start Frontend:${NC}"
echo "  cd frontend && npm run dev"
echo ""
echo -e "${BLUE}Then:${NC}"
echo "  1. Open http://localhost:5173"
echo "  2. Click 'Register' to create a test account"
echo "  3. Use that account to login"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo "  - If backend won't start: Check MongoDB is running"
echo "  - If MongoDB won't start: brew services start mongodb-community"
echo "  - If CORS error: Restart backend after updating .env"
echo ""
