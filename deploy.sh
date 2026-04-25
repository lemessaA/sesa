#!/bin/bash

# SESA Platform Deployment Script
# This script helps prepare your project for deployment

echo "🚀 SESA Platform Deployment Preparation"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo ""

# Check backend
echo "🔧 Checking backend..."
if [ -d "backend" ]; then
    cd backend
    if [ -f "package.json" ]; then
        echo "✅ Backend package.json found"
        
        # Check if build script exists
        if grep -q "render-build" package.json; then
            echo "✅ Build script configured"
        else
            echo "⚠️  Warning: render-build script not found in package.json"
        fi
        
        # Check if start script exists
        if grep -q "render-start" package.json; then
            echo "✅ Start script configured"
        else
            echo "⚠️  Warning: render-start script not found in package.json"
        fi
        
        # Check TypeScript config
        if [ -f "tsconfig.json" ]; then
            echo "✅ TypeScript configuration found"
        else
            echo "⚠️  Warning: tsconfig.json not found"
        fi
        
    else
        echo "❌ Backend package.json not found"
    fi
    cd ..
else
    echo "❌ Backend directory not found"
fi

echo ""

# Check frontend
echo "🎨 Checking frontend..."
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        echo "✅ Frontend package.json found"
        
        # Check if build script exists
        if grep -q "build" package.json; then
            echo "✅ Build script configured"
        else
            echo "⚠️  Warning: build script not found in package.json"
        fi
        
        # Check if Vite config exists
        if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
            echo "✅ Vite configuration found"
        else
            echo "⚠️  Warning: Vite configuration not found"
        fi
        
    else
        echo "❌ Frontend package.json not found"
    fi
    cd ..
else
    echo "❌ Frontend directory not found"
fi

echo ""

# Check Git status
echo "📝 Checking Git status..."
if git status &>/dev/null; then
    echo "✅ Git repository initialized"
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: You have uncommitted changes"
        echo "   Run: git add . && git commit -m 'Deploy to production'"
    else
        echo "✅ All changes committed"
    fi
    
    # Check if we have a remote
    if git remote -v | grep -q origin; then
        echo "✅ Git remote configured"
    else
        echo "⚠️  Warning: No Git remote configured"
        echo "   Add remote: git remote add origin https://github.com/yourusername/your-repo.git"
    fi
else
    echo "❌ Not a Git repository"
    echo "   Initialize: git init && git add . && git commit -m 'Initial commit'"
fi

echo ""

# Environment variables check
echo "🔐 Environment variables checklist:"
echo "   Backend (.env file should NOT be committed):"
echo "   - MONGODB_URI"
echo "   - JWT_SECRET"
echo "   - SENDGRID_API_KEY"
echo "   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET"
echo "   - STRIPE_SECRET_KEY"
echo "   - GROQ_API_KEY (or OPENAI_API_KEY as fallback)"
echo ""
echo "   Frontend (will be set in Vercel):"
echo "   - VITE_API_URL"
echo "   - VITE_GOOGLE_CLIENT_ID"
echo "   - VITE_STRIPE_PUBLISHABLE_KEY"

echo ""
echo "📚 Next steps:"
echo "1. Commit and push your code: git add . && git commit -m 'Deploy' && git push origin main"
echo "2. Deploy backend to Render: https://render.com"
echo "3. Deploy frontend to Vercel: https://vercel.com"
echo "4. Configure environment variables in both platforms"
echo "5. Update CORS settings with your production URLs"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - COMPLETE_DEPLOYMENT_GUIDE.md"
echo "   - DEPLOYMENT_COMMANDS.md"
echo "   - ENVIRONMENT_VARIABLES.md"
echo ""
echo "🎉 Good luck with your deployment!"