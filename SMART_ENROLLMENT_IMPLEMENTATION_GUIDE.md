# Smart Enrollment System - Complete Implementation Guide

## 📋 Overview
This guide provides all steps, variables, and configurations needed to complete the Smart Enrollment System implementation for SESA Academy.

---

## ✅ COMPLETED TASKS

### Phase 1: Backend Data Model ✅
- ✅ User model updated with `courseEnrollments` array
- ✅ Payment model created
- ✅ Course access middleware created
- ✅ Smart enrollment controller created
- ✅ Payment controller created
- ✅ Smart enrollment routes created
- ✅ Payment routes updated

### Phase 2: Backend Integration ✅
- ✅ Smart enrollment routes registered in main router
- ✅ Payment routes updated with course-specific endpoint
- ✅ All TypeScript type issues fixed
- ✅ Middleware properly configured

---

## 🔧 BACKEND SETUP - COMPLETE REFERENCE

### 1. Environment Variables (.env)

**Current Production .env (Render):**
```env
PORT=5000
NODE_ENV=production
APP_NAME=SESA Educational Platform
APP_VERSION=2.0.0

# MongoDB Atlas
MONGO_URI=mongodb+srv://sadiqferegabdushukur_db_user:bt0ORKS3hohvFsNw@sesa.eoifdtg.mongodb.net/sesaApp?retryWrites=true&w=majority

# JWT Secrets
JWT_SECRET=sesa_premium_secret_key_2026_production_change_this_in_real_deployment
JWT_REFRESH_SECRET=sesa_refresh_secret_key_2026_change_this_too

# CORS & URLs
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://devloperameen-sesa-acadamy-git-main-devloperameens-projects.vercel.app,https://devloperameen-sesa-acadamy-kpc63kybe-devloperameens-projects.vercel.app
FRONTEND_URL=https://devloperameen-sesa-acadamy-git-main-devloperameens-projects.vercel.app
BACKEND_URL=https://devloperameen-sesa-acadamy-4.onrender.com
SOCKET_CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://devloperameen-sesa-acadamy-git-main-devloperameens-projects.vercel.app,https://devloperameen-sesa-acadamy-kpc63kybe-devloperameens-projects.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
HELMET_ENABLED=true

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password_here
EMAIL_FROM=SESA Platform <noreply@sesa.edu>

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# APIs
GEMINI_API_KEY=AIzaSyBZHbzKyWyMFnFCr6lBELPd1AGUp2ihqEw
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Logging
LOG_LEVEL=info
```

**Local Development .env:**
```env
PORT=5000
NODE_ENV=development
APP_NAME=SESA Educational Platform
APP_VERSION=2.0.0

# Use local MongoDB (set USE_LOCAL_DB=1 to force local)
USE_LOCAL_DB=1
MONGO_URI=mongodb://localhost:27017/sesa_db

# JWT Secrets
JWT_SECRET=sesa_premium_secret_key_2026_production_change_this_in_real_deployment
JWT_REFRESH_SECRET=sesa_refresh_secret_key_2026_change_this_too

# CORS & URLs
CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173,http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
SOCKET_CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
HELMET_ENABLED=true

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password_here
EMAIL_FROM=SESA Platform <noreply@sesa.edu>

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# APIs
GEMINI_API_KEY=AIzaSyBZHbzKyWyMFnFCr6lBELPd1AGUp2ihqEw
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Logging
LOG_LEVEL=info
```

---

### 2. Data Models

#### User Model (Updated)
**File:** `backend/src/models/User.ts`

**New Field Added:**
```typescript
courseEnrollments: [
  {
    courseId: ObjectId (ref: Course),
    enrollmentDate: Date,
    status: 'active' | 'expired' | 'cancelled',
    accessLevel: 'free' | 'paid',
    approvalStatus: 'pending' | 'approved' | 'rejected',
    expiresAt: Date (optional),
    paymentId: ObjectId (ref: Payment)
  }
]
```

**Backward Compatibility:**
- ✅ Kept existing `enrolledCourses: ObjectId[]`
- ✅ Kept existing `completedCourses: ObjectId[]`
- ✅ All existing fields preserved

#### Payment Model (Created)
**File:** `backend/src/models/Payment.ts`

**Schema:**
```typescript
{
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  amount: Number,
  paymentMethod: 'stripe' | 'paypal' | 'manual',
  status: 'pending' | 'completed' | 'failed',
  transactionId: String (unique),
  paymentDate: Date,
  expiresAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ userId: 1, courseId: 1 }`
- `{ status: 1 }`
- `{ transactionId: 1 }`

#### Course Model (No Changes)
**File:** `backend/src/models/Course.ts`

**Already Has:**
```typescript
lessons: [
  {
    title: String,
    videoUrl: String,
    order: Number,
    isFree: Boolean ✅ (Used for free/paid content)
  }
]
```

---

### 3. Middleware

#### Course Access Middleware
**File:** `backend/src/middleware/courseAccess.ts`

**Functions:**
1. `checkCourseAccess(courseIdParam)` - Main middleware
   - Checks user's enrollment status
   - Attaches `courseAccess` info to request
   - Supports both paid and approved access

2. `requirePaidAccess()` - Enforce paid access
   - Returns 403 if user doesn't have paid/approved access

3. `allowFreeAccess()` - Allow free content
   - Requires authentication
   - Allows access to free lessons

**Usage:**
```typescript
// In routes
router.get('/courses/:courseId/lessons', checkCourseAccess('courseId'), getCourseLessons);
```

---

### 4. Controllers

#### Smart Enrollment Controller
**File:** `backend/src/controllers/smartEnrollmentController.ts`

**Endpoints:**

1. **getUserCourseEnrollments()**
   - Route: `GET /api/smart-enrollment/my-enrollments`
   - Auth: Required
   - Returns: User's all course enrollments with access levels

2. **checkCourseAccessLevel()**
   - Route: `GET /api/smart-enrollment/courses/:courseId/access-check`
   - Auth: Required
   - Returns: Access info for specific course

3. **getCourseWithAccess()**
   - Route: `GET /api/smart-enrollment/courses/:courseId/with-access`
   - Auth: Optional (middleware checks)
   - Returns: Full course data with access-filtered lessons

4. **getLesson()**
   - Route: `GET /api/smart-enrollment/courses/:courseId/lessons/:lessonId`
   - Auth: Optional
   - Returns: Specific lesson with access check
   - Includes: Next/previous lesson IDs

5. **getCourseLessons()**
   - Route: `GET /api/smart-enrollment/courses/:courseId/lessons`
   - Auth: Optional
   - Returns: All lessons with access filtering

#### Payment Controller
**File:** `backend/src/controllers/paymentController.ts`

**New Endpoint:**

1. **processPayment()**
   - Route: `POST /api/payments/course/:courseId`
   - Auth: Required
   - Body: `{ paymentMethod: 'manual' | 'stripe' | 'paypal', amount: Number }`
   - Returns: Payment confirmation
   - Action: Adds course to user's `courseEnrollments` with `accessLevel: 'paid'`

**Existing Endpoints (Preserved):**
- `createPayment()` - Generic payment creation
- `confirmPayment()` - Confirm payment
- `getUserPayments()` - Get user's payment history
- `getPaymentDetails()` - Get specific payment
- `verifyPayment()` - Verify payment status

---

### 5. Routes

#### Smart Enrollment Routes
**File:** `backend/src/routes/smartEnrollment.ts`

**Endpoints:**
```
GET  /api/smart-enrollment/my-enrollments
GET  /api/smart-enrollment/courses/:courseId/access-check
GET  /api/smart-enrollment/courses/:courseId/with-access
GET  /api/smart-enrollment/courses/:courseId/lessons
GET  /api/smart-enrollment/courses/:courseId/lessons/:lessonId
```

#### Payment Routes (Updated)
**File:** `backend/src/routes/payments.ts`

**New Endpoint:**
```
POST /api/payments/course/:courseId
```

---

### 6. Main Router Integration
**File:** `backend/src/index.ts`

**Added:**
```typescript
import smartEnrollmentRoutes from './routes/smartEnrollment.js';

// In route registration section:
app.use('/api/smart-enrollment', smartEnrollmentRoutes);
```

---

## 🚀 NEXT STEPS - FRONTEND IMPLEMENTATION

### Phase 3: Frontend Components

#### New Components to Create:

1. **CoursePage.tsx** (`frontend/src/pages/CoursePage.tsx`)
   - Displays course with free/paid content
   - Shows lesson list with lock icons
   - Handles unlock flow

2. **LessonViewer.tsx** (`frontend/src/components/LessonViewer.tsx`)
   - Video player for lessons
   - Navigation (prev/next)
   - Progress tracking

3. **PaymentPage.tsx** (`frontend/src/pages/PaymentPage.tsx`)
   - Payment form
   - Course info display
   - Success/error handling

4. **EnrollmentCard.tsx** (`frontend/src/components/EnrollmentCard.tsx`)
   - Shows enrollment status
   - Access level badge
   - Action buttons

5. **LockedLessonCard.tsx** (`frontend/src/components/LockedLessonCard.tsx`)
   - Displays locked lesson
   - Shows unlock button
   - Blur overlay

#### Updated Components:

1. **CourseCard.tsx** - Add enrollment status badge
2. **Dashboard.tsx** - Add "My Courses" section
3. **Navigation.tsx** - Add "My Courses" link
4. **App.tsx** - Add dynamic routes

---

## 📊 API Response Examples

### 1. Get Course with Access
**Request:**
```
GET /api/smart-enrollment/courses/courseId123/with-access
Authorization: Bearer token
```

**Response:**
```json
{
  "success": true,
  "course": {
    "_id": "courseId123",
    "title": "Grade 10 Biology",
    "price": 99.99,
    "lessons": [
      {
        "_id": "lesson1",
        "title": "Introduction to Biology",
        "order": 1,
        "isFree": true,
        "isAccessible": true,
        "videoUrl": "https://..."
      },
      {
        "_id": "lesson2",
        "title": "Cell Structure",
        "order": 2,
        "isFree": false,
        "isAccessible": false
      }
    ],
    "userAccess": {
      "hasPaidAccess": false,
      "accessLevel": "free",
      "enrollmentStatus": "none"
    },
    "canUnlock": true
  }
}
```

### 2. Process Payment
**Request:**
```
POST /api/payments/course/courseId123
Authorization: Bearer token
Content-Type: application/json

{
  "paymentMethod": "manual",
  "amount": 99.99
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment successful! Course unlocked.",
  "payment": {
    "paymentId": "payment123",
    "courseId": "courseId123",
    "amount": 99.99,
    "status": "completed",
    "transactionId": "TXN-1712876543210-abc123def"
  }
}
```

### 3. Get User Enrollments
**Request:**
```
GET /api/smart-enrollment/my-enrollments
Authorization: Bearer token
```

**Response:**
```json
{
  "success": true,
  "enrollments": [
    {
      "courseId": "courseId123",
      "enrollmentDate": "2026-04-11T10:30:00Z",
      "status": "active",
      "accessLevel": "paid",
      "approvalStatus": "approved",
      "paymentId": "payment123"
    },
    {
      "courseId": "courseId456",
      "enrollmentDate": "2026-04-10T15:45:00Z",
      "status": "active",
      "accessLevel": "free",
      "approvalStatus": "pending"
    }
  ]
}
```

---

## 🧪 Testing Checklist

### Backend Testing

- [ ] Test free lesson access (no authentication)
- [ ] Test free lesson access (with authentication)
- [ ] Test paid lesson access (without enrollment)
- [ ] Test paid lesson access (with enrollment)
- [ ] Test payment processing
- [ ] Test enrollment creation
- [ ] Test access check endpoint
- [ ] Test course with access endpoint
- [ ] Test user enrollments endpoint
- [ ] Test cross-course isolation (user can't access other courses)

### Frontend Testing

- [ ] Course page loads correctly
- [ ] Free lessons display without lock
- [ ] Paid lessons show lock icon
- [ ] Unlock button redirects to payment
- [ ] Payment page displays correctly
- [ ] Payment processing works
- [ ] After payment, lessons unlock
- [ ] Dashboard shows enrolled courses
- [ ] Progress tracking works per course
- [ ] Navigation links work correctly

---

## 🔐 Security Considerations

### Access Control
- ✅ Middleware checks `courseEnrollments` array
- ✅ No direct access to paid content without enrollment
- ✅ Payment verification before granting access
- ✅ Course-specific access (no cross-course access)

### Data Integrity
- ✅ Payment records stored for audit
- ✅ Enrollment status tracked
- ✅ Transaction IDs unique
- ✅ User authentication required for payments

### Payment Security
- ✅ Amount verified against course price
- ✅ Duplicate payment prevention
- ✅ Transaction ID generation
- ✅ Payment status tracking

---

## 📝 Database Queries

### Find User's Paid Courses
```javascript
db.users.findOne({ _id: userId }, { courseEnrollments: 1 })
  .then(user => {
    const paidCourses = user.courseEnrollments.filter(e => e.accessLevel === 'paid');
  });
```

### Find All Payments for User
```javascript
db.payments.find({ userId: userId }).sort({ paymentDate: -1 });
```

### Find Course Enrollments
```javascript
db.users.find({ 
  "courseEnrollments.courseId": courseId,
  "courseEnrollments.accessLevel": "paid"
});
```

---

## 🚀 Deployment Steps

### 1. Local Testing
```bash
# Start backend
cd backend
npm install
npm run dev

# Start frontend
cd frontend
npm install
npm run dev
```

### 2. Commit Changes
```bash
git add .
git commit -m "feat: implement smart enrollment system - phase 1 & 2"
git push origin main
```

### 3. Deploy to Render (Backend)
- Push to GitHub
- Render auto-deploys from main branch
- Verify deployment at: https://devloperameen-sesa-acadamy-4.onrender.com

### 4. Deploy to Vercel (Frontend)
- Push to GitHub
- Vercel auto-deploys from main branch
- Verify deployment at: https://devloperameen-sesa-acadamy-git-main-devloperameens-projects.vercel.app

---

## 📚 File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.ts (UPDATED - added courseEnrollments)
│   │   ├── Payment.ts (CREATED)
│   │   └── Course.ts (NO CHANGES)
│   ├── middleware/
│   │   └── courseAccess.ts (CREATED)
│   ├── controllers/
│   │   ├── smartEnrollmentController.ts (CREATED)
│   │   └── paymentController.ts (UPDATED - added processPayment)
│   ├── routes/
│   │   ├── smartEnrollment.ts (CREATED)
│   │   └── payments.ts (UPDATED - added course endpoint)
│   └── index.ts (UPDATED - added smart enrollment routes)
└── .env (CONFIGURED)

frontend/
├── src/
│   ├── pages/
│   │   ├── CoursePage.tsx (TO CREATE)
│   │   └── PaymentPage.tsx (TO CREATE)
│   ├── components/
│   │   ├── LessonViewer.tsx (TO CREATE)
│   │   ├── EnrollmentCard.tsx (TO CREATE)
│   │   ├── LockedLessonCard.tsx (TO CREATE)
│   │   ├── CourseCard.tsx (TO UPDATE)
│   │   └── Navigation.tsx (TO UPDATE)
│   ├── App.tsx (TO UPDATE - add routes)
│   └── .env (CONFIGURED)
```

---

## ✅ Verification Checklist

### Backend
- [x] User model has courseEnrollments
- [x] Payment model created
- [x] Course access middleware created
- [x] Smart enrollment controller created
- [x] Payment controller updated
- [x] Smart enrollment routes created
- [x] Payment routes updated
- [x] Routes registered in main router
- [x] No TypeScript errors
- [x] All imports correct

### Frontend (Next)
- [ ] CoursePage component created
- [ ] LessonViewer component created
- [ ] PaymentPage component created
- [ ] EnrollmentCard component created
- [ ] LockedLessonCard component created
- [ ] CourseCard component updated
- [ ] Dashboard component updated
- [ ] Navigation component updated
- [ ] App.tsx routes updated
- [ ] Frontend .env configured

### Testing (Next)
- [ ] All backend endpoints tested
- [ ] All frontend components tested
- [ ] Payment flow tested
- [ ] Access control tested
- [ ] Cross-course isolation verified
- [ ] Backward compatibility verified

---

## 🎯 Key Variables & Constants

### API Base URLs
```
Development: http://localhost:5000/api
Production: https://devloperameen-sesa-acadamy-4.onrender.com/api
```

### Endpoints
```
Smart Enrollment:
  GET  /smart-enrollment/my-enrollments
  GET  /smart-enrollment/courses/:courseId/access-check
  GET  /smart-enrollment/courses/:courseId/with-access
  GET  /smart-enrollment/courses/:courseId/lessons
  GET  /smart-enrollment/courses/:courseId/lessons/:lessonId

Payments:
  POST /payments/course/:courseId
  GET  /payments/my-payments
  GET  /payments/:paymentId
  GET  /payments/:paymentId/verify
```

### Status Values
```
Enrollment Status: 'active' | 'expired' | 'cancelled'
Access Level: 'free' | 'paid'
Approval Status: 'pending' | 'approved' | 'rejected'
Payment Status: 'pending' | 'completed' | 'failed'
```

---

## 📞 Support & Troubleshooting

### Common Issues

1. **"Access denied" error**
   - Check if user has paid enrollment
   - Verify courseId matches
   - Check enrollment status is 'active'

2. **"Course not found" error**
   - Verify courseId is valid
   - Check course exists in database

3. **Payment not processing**
   - Verify amount matches course price
   - Check user authentication
   - Verify payment method is valid

4. **Lessons not showing**
   - Check course has lessons array
   - Verify lesson.isFree flag is set
   - Check user access level

---

## 🎉 Summary

**Completed:**
- ✅ Backend data models (User, Payment)
- ✅ Access control middleware
- ✅ Smart enrollment controller
- ✅ Payment processing
- ✅ API routes and endpoints
- ✅ Main router integration
- ✅ Environment configuration

**Next:**
- 🔄 Frontend components
- 🔄 Dynamic routing
- 🔄 Payment UI
- 🔄 Testing & deployment

**Status:** Backend Phase 1 & 2 Complete ✅ | Ready for Frontend Phase 3 🚀
