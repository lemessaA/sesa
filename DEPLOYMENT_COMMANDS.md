# Quick Deployment Commands for SESA Platform

## 🚀 Step-by-Step Deployment Process

### Step 1: Push to GitHub
```bash
# In your project root directory
git add .
git commit -m "Deploy SESA platform to production"
git push origin main
```

### Step 2: Deploy Backend to Render

**Backend Configuration (already set up in your package.json):**
- ✅ Build command: `npm run render-build` (compiles TypeScript)
- ✅ Start command: `npm run render-start` (runs compiled JavaScript)
- ✅ Node version: 18+ specified

**Render Deployment Steps:**
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `sesa-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`
   - **Root Directory**: `backend`

**Environment Variables to Add in Render:**
```
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Step 3: Deploy Frontend to Vercel

**Frontend Configuration (Vite + React):**
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: Vite

**Vercel Deployment Steps:**
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

**Environment Variables to Add in Vercel:**
```
VITE_API_URL=https://your-backend-name.onrender.com
VITE_ENVIRONMENT=production
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Step 4: Update Frontend API Configuration

Create/update `frontend/src/config/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
};

export default API_BASE_URL;
```

### Step 5: Update Backend CORS Configuration

Update your backend CORS settings in `backend/src/index.ts`:
```typescript
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'https://your-frontend-name.vercel.app', // Replace with your Vercel URL
    process.env.CORS_ORIGIN // From environment variable
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🔧 MongoDB Atlas Setup

### Create Database:
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster (M0)
3. Create database user with read/write permissions
4. Add IP address `0.0.0.0/0` to network access
5. Get connection string and add to Render environment variables

---

## 🧪 Testing Deployment

### Test Backend:
```bash
# Test your deployed backend API
curl https://your-backend-name.onrender.com/api/health
```

### Test Frontend:
1. Visit your Vercel URL
2. Try registering/logging in
3. Check browser console for errors

---

## 🔄 Future Updates

### For Code Changes:
```bash
git add .
git commit -m "Update: describe your changes"
git push origin main
```
- Render will automatically redeploy backend
- Vercel will automatically redeploy frontend

### For Environment Variables:
- Update in Render dashboard for backend
- Update in Vercel dashboard for frontend
- Redeploy if needed

---

## 🚨 Common Issues & Solutions

### Backend Issues:
- **Build fails**: Check TypeScript compilation errors
- **Database connection fails**: Verify MongoDB URI format
- **CORS errors**: Update CORS_ORIGIN environment variable

### Frontend Issues:
- **Build fails**: Check for TypeScript errors or missing dependencies
- **API calls fail**: Verify VITE_API_URL is correct
- **Environment variables not working**: Ensure they start with VITE_

### Integration Issues:
- **Authentication fails**: Check JWT secrets match
- **CORS errors**: Update backend CORS configuration
- **Socket.io connection fails**: Update socket connection URL

---

## 📋 Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub
- [ ] MongoDB Atlas cluster created and configured
- [ ] All environment variables prepared
- [ ] CORS configuration updated with production URLs
- [ ] API endpoints tested locally
- [ ] Frontend build tested locally (`npm run build`)
- [ ] All sensitive data moved to environment variables

---

## 🎯 Your Deployment URLs

After deployment, you'll have:
- **Backend API**: `https://your-backend-name.onrender.com`
- **Frontend App**: `https://your-frontend-name.vercel.app`
- **Database**: MongoDB Atlas cluster

Remember to update the CORS_ORIGIN and VITE_API_URL with your actual deployment URLs!