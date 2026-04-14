# Copy-Paste AI Prompts for Lovable & Cursor

Use these prompts directly in Lovable (frontend) and Cursor (backend) to continue development.

---

## 🎨 LOVABLE FRONTEND PROMPT

**Copy this entire prompt and paste it into Lovable chat:**

```
You are building the SESA Academy frontend - a React 18 + TypeScript + Tailwind CSS application.

CURRENT STATUS:
- Smart enrollment system backend is DONE
- Frontend components created but NOT YET integrated
- Login is working (use local backend at http://localhost:5000/api)
- Need to complete frontend integration

IMMEDIATE TASKS:

1. ADD ROUTE TO App.tsx:
   - Import CoursePage from './components/enrollment/CoursePage'
   - Add route: <Route path="/courses/:courseId" element={<ProtectedRoute wrapLayout><CoursePage /></ProtectedRoute>} />
   - This enables dynamic course viewing

2. UPDATE PAYMENT FLOW:
   - In frontend/src/pages/Payment.tsx
   - After successful payment, call: POST /api/enrollments/enroll with { courseId, userId }
   - This adds the course to user.courseEnrollments
   - Then redirect to /courses/:courseId

3. TEST ENROLLMENT SYSTEM:
   - Login with test account
   - Navigate to a course
   - Verify free lesson is visible
   - Verify paid lessons show lock icon
   - Click "Unlock" button
   - Complete payment
   - Verify full access after payment

4. IMPLEMENT PERFORMANCE OPTIMIZATION (7 phases):
   Phase 1: Code Splitting
   - Use React.lazy() for: CoursePage, Dashboard, Marketplace
   - Wrap with Suspense and LoadingSpinner
   
   Phase 2: Image Optimization
   - Convert hero images to WebP
   - Add lazy loading to all images
   - Compress background images
   
   Phase 3: Font Optimization
   - Use font-display: swap
   - Reduce font weights (remove unused)
   - Load fonts asynchronously
   
   Phase 4: Bundle Optimization
   - Remove unused libraries
   - Enable tree shaking
   - Check bundle size with: npm run build
   
   Phase 5: Caching
   - Add service worker for offline support
   - Cache API responses in localStorage
   - Implement cache invalidation
   
   Phase 6: React Optimization
   - Use React.memo for expensive components
   - Implement useMemo for complex calculations
   - Use useCallback for event handlers
   
   Phase 7: Animation Optimization
   - Use will-change CSS property
   - Reduce animation complexity
   - Use GPU acceleration

TECH STACK:
- React 18, TypeScript, Tailwind CSS
- Framer Motion for animations
- Axios for API calls
- React Router v6
- Lucide icons

KEY FILES:
- frontend/src/App.tsx - Add route here
- frontend/src/pages/Payment.tsx - Update payment flow
- frontend/src/components/enrollment/CoursePage.tsx - Already created
- frontend/src/utils/api.ts - API service
- frontend/.env - Set VITE_API_URL=http://localhost:5000/api

IMPORTANT:
- DO NOT break existing features
- DO NOT change current UI layout
- DO NOT modify existing working APIs
- ONLY extend functionality safely
- Maintain all navigation (Home, Subjects, Dashboard, etc.)
- Preserve current styling, animations, and branding

TESTING:
After each change:
1. Run: npm run dev
2. Open http://localhost:5173
3. Test login/register
4. Test course enrollment
5. Test payment flow
6. Check console for errors
7. Verify no breaking changes

EXPECTED OUTCOME:
- Users can view courses at /courses/:courseId
- Free lessons visible without payment
- Paid lessons locked with unlock button
- Payment flow works end-to-end
- Performance improved significantly
- Zero breaking changes
```

---

## ⚙️ CURSOR BACKEND PROMPT

**Copy this entire prompt and paste it into Cursor chat:**

```
You are building the SESA Academy backend - a Node.js + Express + TypeScript application.

CURRENT STATUS:
- Smart enrollment system DONE
- Auth system working
- Payment system ready
- AI tutor system ready
- Real-time collaboration ready
- Advanced analytics ready
- Login issue FIXED (removed duplicate route registration)

IMMEDIATE TASKS:

1. VERIFY BACKEND IS WORKING:
   - Start backend: npm run dev
   - Check logs for "Connected to MongoDB"
   - Test health endpoint: curl http://localhost:5000/api/health
   - Should return: {"status":"ok","dbStatus":"connected",...}

2. TEST ENROLLMENT ENDPOINTS:
   - GET /api/enrollments/my-enrollments - Get user's enrollments
   - GET /api/enrollments/courses/:courseId/access - Check access
   - GET /api/enrollments/courses/:courseId/with-access - Get course with access info
   - POST /api/enrollments/enroll - Enroll user in course (called after payment)

3. TEST PAYMENT FLOW:
   - POST /api/payments - Create payment
   - Verify payment record created
   - Verify user.courseEnrollments updated
   - Verify accessLevel set to 'paid'

4. VERIFY NO BREAKING CHANGES:
   - All existing routes still work
   - All existing endpoints respond correctly
   - No duplicate route registrations
   - No middleware conflicts
   - Database connections stable

5. ENHANCE FEATURES (Optional):
   - Add payment webhook handling for Stripe
   - Add email notifications for enrollment
   - Add analytics tracking for enrollments
   - Add refund handling
   - Add subscription support

TECH STACK:
- Node.js 18+, Express, TypeScript
- MongoDB + Mongoose
- JWT authentication
- Socket.io for real-time
- Winston for logging
- Stripe/PayPal for payments

KEY FILES:
- backend/src/index.ts - Main entry point (FIXED: removed duplicate routes)
- backend/src/routes/enrollmentRoutes.ts - Enrollment endpoints
- backend/src/controllers/enrollmentController.ts - Enrollment logic
- backend/src/middleware/enrollmentCheck.ts - Access control
- backend/src/models/User.ts - User schema with courseEnrollments
- backend/src/models/Payment.ts - Payment schema
- backend/.env - Configuration

IMPORTANT:
- DO NOT break existing features
- DO NOT modify existing working APIs
- ONLY extend functionality safely
- Maintain backward compatibility
- Keep all existing routes working
- Preserve current authentication system

TESTING:
After each change:
1. Run: npm run dev
2. Check logs for errors
3. Test endpoints with curl or Postman
4. Verify database updates
5. Check no console errors
6. Verify no breaking changes

CURL EXAMPLES:

# Register test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Get enrollments (use token from login)
curl -X GET http://localhost:5000/api/enrollments/my-enrollments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check course access
curl -X GET http://localhost:5000/api/enrollments/courses/COURSE_ID/access \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enroll in course (after payment)
curl -X POST http://localhost:5000/api/enrollments/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"courseId":"COURSE_ID"}'

EXPECTED OUTCOME:
- All endpoints working correctly
- No breaking changes
- Database updates working
- Authentication working
- Payment flow working
- Ready for frontend integration
```

---

## 🔧 QUICK SETUP SCRIPT

**Run this to set up local development:**

```bash
#!/bin/bash

# 1. Update frontend .env
echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env

# 2. Start MongoDB
brew services start mongodb-community

# 3. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Start backend (Terminal 1)
echo "Starting backend..."
cd backend && npm run dev

# 5. Start frontend (Terminal 2)
echo "Starting frontend..."
cd frontend && npm run dev

# 6. Open browser
echo "Opening http://localhost:5173..."
open http://localhost:5173
```

---

## 📋 VERIFICATION CHECKLIST

### Backend
- [ ] Backend starts without errors
- [ ] MongoDB connected
- [ ] Health endpoint responds
- [ ] Auth endpoints working
- [ ] Enrollment endpoints working
- [ ] Payment endpoints working
- [ ] No duplicate routes
- [ ] No console errors

### Frontend
- [ ] Frontend starts without errors
- [ ] Can register new account
- [ ] Can login with account
- [ ] Can view courses
- [ ] Can see free lessons
- [ ] Can see locked lessons
- [ ] Can click unlock button
- [ ] Can complete payment
- [ ] Can access paid lessons after payment

### Integration
- [ ] Frontend connects to backend
- [ ] API calls working
- [ ] Token stored in localStorage
- [ ] User data displayed correctly
- [ ] Enrollment data synced
- [ ] Payment flow complete
- [ ] No CORS errors
- [ ] No network errors

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Deploying to Production

**Backend (Render):**
- [ ] All environment variables set
- [ ] MongoDB Atlas access configured
- [ ] CORS_ORIGIN includes frontend URL
- [ ] JWT_SECRET set
- [ ] Logging configured
- [ ] Error tracking enabled
- [ ] Health check working
- [ ] Database backups enabled

**Frontend (Vercel/Netlify):**
- [ ] VITE_API_URL points to production backend
- [ ] Build process working
- [ ] All environment variables set
- [ ] Analytics tracking enabled
- [ ] Error tracking enabled
- [ ] SEO meta tags added
- [ ] Service worker configured
- [ ] CDN configured

---

## 📞 TROUBLESHOOTING

### Backend Won't Start
```bash
# Check Node version
node --version  # Should be 16+

# Check MongoDB
brew services list  # Should show mongodb-community running

# Check port
lsof -i :5000  # Should be empty

# Clear node_modules and reinstall
rm -rf backend/node_modules
cd backend && npm install
```

### Frontend Won't Start
```bash
# Check Node version
node --version  # Should be 16+

# Check port
lsof -i :5173  # Should be empty

# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend && npm install
```

### Login Not Working
```bash
# 1. Check backend is running
curl http://localhost:5000/api/health

# 2. Check frontend .env
cat frontend/.env  # Should show http://localhost:5000/api

# 3. Check browser console for errors
# Open DevTools → Console → Look for red errors

# 4. Check network requests
# Open DevTools → Network → Try login → Check requests
```

### CORS Error
```bash
# Update backend/.env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Restart backend
npm run dev
```

---

## 📚 DOCUMENTATION

- `LOGIN_FIX_GUIDE.md` - Login troubleshooting
- `TROUBLESHOOTING_LOGIN.md` - Detailed troubleshooting
- `QUICK_START_GUIDE.md` - Setup guide
- `DEPLOYMENT_GUIDE.md` - Deployment guide
- `AI_PROMPT_FRONTEND_LOVABLE.md` - Full frontend prompt
- `AI_PROMPT_BACKEND_CURSOR.md` - Full backend prompt

---

## ✨ NEXT STEPS

1. **Copy the appropriate prompt** (Lovable or Cursor)
2. **Paste into the AI chat**
3. **Follow the instructions**
4. **Test thoroughly**
5. **Deploy to production**

---

**Last Updated:** April 12, 2026  
**Status:** Ready to Use  
**Version:** 1.0.0
