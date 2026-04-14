# Complete Login Troubleshooting Guide

## 🎯 Quick Start (5 minutes)

### Step 1: Switch to Local Backend
```bash
# Edit frontend/.env
VITE_API_URL=http://localhost:5000/api
```

### Step 2: Start Backend
```bash
cd backend
npm install
npm run dev
```

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Test Login
- Open http://localhost:5173
- Click "Register" to create a test account
- Use that account to login

---

## 🔍 Detailed Diagnosis

### Check 1: Is Backend Running?

**Local Backend:**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "dbStatus": "connected",
  "timestamp": "2026-04-12T..."
}
```

**If it fails:**
- Backend is not running
- Start it: `cd backend && npm run dev`

---

### Check 2: Is MongoDB Connected?

**Look for in backend logs:**
```
✅ Connected to MongoDB
```

**If you see:**
```
❌ MongoDB Connection Failed
```

**Fix:**
1. Ensure MongoDB is running locally:
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or use Docker
   docker run -d -p 27017:27017 mongo
   ```

2. Or use MongoDB Atlas (cloud):
   - Update `MONGO_URI` in `backend/.env`
   - Ensure your IP is whitelisted in Atlas

---

### Check 3: Is Frontend Pointing to Correct Backend?

**Check frontend/.env:**
```bash
cat frontend/.env
```

**Should show:**
```
VITE_API_URL=http://localhost:5000/api
```

**If it shows Render URL:**
```
VITE_API_URL=https://devloperameen-sesa-acadamy-4.onrender.com/api
```

**Fix:**
```bash
# Update frontend/.env
VITE_API_URL=http://localhost:5000/api

# Restart frontend dev server
cd frontend && npm run dev
```

---

### Check 4: Test Login API Directly

```bash
# Create a test user first (register)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456"
  }'

# Then try login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

**If you get an error:**
- Check the error message in the response
- See "Common Errors" section below

---

## ⚠️ Common Errors & Fixes

### Error 1: "Something went wrong. Please try again."

**Cause:** Backend is not responding (timeout)

**Fix:**
1. Check if backend is running: `curl http://localhost:5000/api/health`
2. Check frontend .env points to correct URL
3. Check browser console for network errors
4. Restart both backend and frontend

---

### Error 2: "Invalid credentials."

**Cause:** Email or password is wrong

**Fix:**
1. Double-check email and password
2. Try registering a new account first
3. Check if user exists in database

---

### Error 3: "This account uses Google sign-in. Use 'Continue with Google'."

**Cause:** User was registered with Google OAuth, not email/password

**Fix:**
1. Use "Continue with Google" button instead
2. Or register a new account with email/password

---

### Error 4: "Account is locked due to too many failed attempts."

**Cause:** Too many wrong password attempts (5 attempts)

**Fix:**
1. Wait 30 minutes for account to unlock
2. Or use password reset: "Forgot password?"

---

### Error 5: "Service temporarily unavailable. The database is reconnecting..."

**Cause:** MongoDB is not connected

**Fix:**
1. Start MongoDB: `brew services start mongodb-community`
2. Or use Docker: `docker run -d -p 27017:27017 mongo`
3. Check MONGO_URI in backend/.env
4. Restart backend

---

### Error 6: "CORS error" (in browser console)

**Cause:** Frontend and backend CORS not configured correctly

**Fix:**
1. Check backend/.env:
   ```
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   ```

2. Restart backend after changing .env

---

## 🧪 Full Test Scenario

### Scenario: Complete Login Flow

**Step 1: Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Step 2: Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Step 3: Use Token**
```bash
# Copy the token from login response
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Get user profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Checklist

- [ ] Backend is running locally
- [ ] MongoDB is connected
- [ ] Frontend .env points to `http://localhost:5000/api`
- [ ] Frontend dev server is running
- [ ] Can access http://localhost:5173
- [ ] Can register a new account
- [ ] Can login with registered account
- [ ] Token is stored in localStorage
- [ ] User is redirected to home page

---

## 🚀 Production Deployment (Render)

If you want to use the Render backend:

### Step 1: Fix Backend on Render

1. Go to https://dashboard.render.com
2. Select your backend service
3. Go to "Environment" tab
4. Verify these variables:
   - `MONGO_URI` - MongoDB Atlas connection string
   - `JWT_SECRET` - Any random string
   - `CORS_ORIGIN` - Include your frontend URL

### Step 2: Fix MongoDB Atlas Access

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Go to "Network Access"
4. Add your Render IP (or 0.0.0.0/0 for testing)
5. Click "Confirm"

### Step 3: Restart Backend

1. In Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait 2-3 minutes
4. Check logs for "Connected to MongoDB"

### Step 4: Update Frontend

```bash
# frontend/.env
VITE_API_URL=https://devloperameen-sesa-acadamy-4.onrender.com/api
```

### Step 5: Test

- Go to your frontend URL
- Try login
- Check browser console for errors

---

## 📞 Still Having Issues?

### Collect Debug Info

```bash
# 1. Backend health
curl http://localhost:5000/api/health

# 2. Backend logs (last 50 lines)
# If running locally: check terminal output
# If on Render: check dashboard logs

# 3. Frontend console errors
# Open DevTools → Console → Look for red errors

# 4. Network requests
# Open DevTools → Network → Try login → Check requests
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Node.js version (need 16+), run `npm install` |
| MongoDB won't connect | Start MongoDB or check MONGO_URI |
| CORS error | Update CORS_ORIGIN in backend/.env |
| Token not saving | Check localStorage in DevTools |
| Redirect not working | Check React Router setup in App.tsx |

---

## 📚 Related Files

- `backend/src/routes/auth.ts` - Login endpoint
- `backend/src/controllers/authController.ts` - Auth logic (if exists)
- `frontend/src/pages/auth/Login.tsx` - Login form
- `frontend/src/context/AuthContext.tsx` - Auth state management
- `frontend/src/utils/api.ts` - API service
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

---

## ✨ Next Steps

1. **Immediate**: Get local backend working
2. **Short-term**: Test all auth flows (register, login, logout)
3. **Medium-term**: Fix Render backend for production
4. **Long-term**: Add OAuth (Google, GitHub) for better UX
