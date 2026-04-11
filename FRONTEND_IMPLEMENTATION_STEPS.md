# Frontend Implementation - Smart Enrollment System

## 🎯 Quick Reference: All Steps with Variables

---

## STEP 1: Create CoursePage Component

**File:** `frontend/src/pages/CoursePage.tsx`

**Key Variables:**
```typescript
const courseId = params.courseId;
const [course, setCourse] = useState(null);
const [userAccess, setUserAccess] = useState({
  hasPaidAccess: false,
  accessLevel: 'free', // 'free' | 'paid' | 'none'
  enrollmentStatus: 'none' // 'none' | 'pending' | 'approved' | 'paid'
});
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

**API Call:**
```typescript
const fetchCourseWithAccess = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/smart-enrollment/courses/${courseId}/with-access`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setCourse(data.course);
    setUserAccess(data.course.userAccess);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Render Logic:**
```typescript
// Show free lessons
course.lessons.map(lesson => (
  lesson.isFree ? (
    <FreeLesson key={lesson._id} lesson={lesson} />
  ) : (
    <PaidLesson 
      key={lesson._id} 
      lesson={lesson} 
      isAccessible={lesson.isAccessible}
      courseId={courseId}
    />
  )
))
```

---

## STEP 2: Create LessonViewer Component

**File:** `frontend/src/components/LessonViewer.tsx`

**Key Variables:**
```typescript
const { courseId, lessonId } = params;
const [lesson, setLesson] = useState(null);
const [nextLessonId, setNextLessonId] = useState(null);
const [previousLessonId, setPreviousLessonId] = useState(null);
const [hasAccess, setHasAccess] = useState(false);
```

**API Call:**
```typescript
const fetchLesson = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/smart-enrollment/courses/${courseId}/lessons/${lessonId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setLesson(data.lesson);
    setHasAccess(data.lesson.isAccessible);
    setNextLessonId(data.lesson.nextLessonId);
    setPreviousLessonId(data.lesson.previousLessonId);
  } catch (err) {
    if (err.status === 403) {
      setHasAccess(false);
    }
  }
};
```

**Navigation:**
```typescript
// Next lesson button
const goToNextLesson = () => {
  navigate(`/courses/${courseId}/lesson/${nextLessonId}`);
};

// Previous lesson button
const goToPreviousLesson = () => {
  navigate(`/courses/${courseId}/lesson/${previousLessonId}`);
};
```

---

## STEP 3: Create PaymentPage Component

**File:** `frontend/src/pages/PaymentPage.tsx`

**Key Variables:**
```typescript
const courseId = params.courseId;
const [course, setCourse] = useState(null);
const [amount, setAmount] = useState(0);
const [paymentMethod, setPaymentMethod] = useState('manual'); // 'manual' | 'stripe' | 'paypal'
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState(null);
```

**Fetch Course Price:**
```typescript
const fetchCoursePrice = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setCourse(data);
    setAmount(data.price);
  } catch (err) {
    setError('Failed to load course');
  }
};
```

**Process Payment:**
```typescript
const handlePayment = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/payments/course/${courseId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod,
          amount
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      setSuccess(true);
      // Redirect to course after 2 seconds
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 2000);
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError('Payment failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## STEP 4: Create EnrollmentCard Component

**File:** `frontend/src/components/EnrollmentCard.tsx`

**Key Variables:**
```typescript
interface EnrollmentCardProps {
  course: {
    _id: string;
    title: string;
    price: number;
    instructor: { name: string };
  };
  enrollment: {
    accessLevel: 'free' | 'paid';
    enrollmentDate: Date;
    status: 'active' | 'expired' | 'cancelled';
  };
}

const [progress, setProgress] = useState(0);
```

**Render:**
```typescript
<div className="enrollment-card">
  <h3>{course.title}</h3>
  
  {/* Access Badge */}
  <span className={`badge badge-${enrollment.accessLevel}`}>
    {enrollment.accessLevel === 'paid' ? '🔓 Full Access' : '🔒 Free Preview'}
  </span>
  
  {/* Progress Bar */}
  <div className="progress-bar">
    <div style={{ width: `${progress}%` }}></div>
  </div>
  
  {/* Action Button */}
  <button onClick={() => navigate(`/courses/${course._id}`)}>
    Continue Learning
  </button>
</div>
```

---

## STEP 5: Create LockedLessonCard Component

**File:** `frontend/src/components/LockedLessonCard.tsx`

**Key Variables:**
```typescript
interface LockedLessonCardProps {
  lesson: {
    _id: string;
    title: string;
    order: number;
  };
  courseId: string;
  coursePrice: number;
}
```

**Render:**
```typescript
<div className="lesson-card locked">
  {/* Blur Overlay */}
  <div className="blur-overlay"></div>
  
  {/* Lock Icon */}
  <div className="lock-icon">🔒</div>
  
  {/* Lesson Info */}
  <h4>{lesson.title}</h4>
  <p>Lesson {lesson.order}</p>
  
  {/* Unlock Button */}
  <button 
    className="btn-unlock"
    onClick={() => navigate(`/payment/${courseId}`)}
  >
    Unlock Full Course - ${coursePrice}
  </button>
</div>
```

---

## STEP 6: Update CourseCard Component

**File:** `frontend/src/components/CourseCard.tsx`

**Add Variables:**
```typescript
const [userAccess, setUserAccess] = useState({
  accessLevel: 'none', // 'free' | 'paid' | 'none'
  enrollmentStatus: 'none'
});
```

**Add API Call:**
```typescript
const checkAccess = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/smart-enrollment/courses/${course._id}/access-check`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setUserAccess({
      accessLevel: data.accessLevel,
      enrollmentStatus: data.enrollmentStatus
    });
  } catch (err) {
    // User not authenticated or error
  }
};
```

**Add Badge:**
```typescript
{userAccess.accessLevel === 'paid' && (
  <span className="badge badge-paid">✓ Enrolled</span>
)}
{userAccess.accessLevel === 'free' && (
  <span className="badge badge-free">Free Preview</span>
)}
```

**Update Button:**
```typescript
<button onClick={() => navigate(`/courses/${course._id}`)}>
  {userAccess.accessLevel === 'paid' ? 'Continue' : 'View Course'}
</button>
```

---

## STEP 7: Update Dashboard Component

**File:** `frontend/src/components/Dashboard.tsx`

**Add Section:**
```typescript
const [enrollments, setEnrollments] = useState([]);

const fetchEnrollments = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/smart-enrollment/my-enrollments`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setEnrollments(data.enrollments);
  } catch (err) {
    console.error('Failed to fetch enrollments');
  }
};

useEffect(() => {
  fetchEnrollments();
}, []);
```

**Render:**
```typescript
<section className="my-courses">
  <h2>My Courses</h2>
  <div className="courses-grid">
    {enrollments.map(enrollment => (
      <EnrollmentCard 
        key={enrollment.courseId}
        enrollment={enrollment}
      />
    ))}
  </div>
</section>
```

---

## STEP 8: Update Navigation Component

**File:** `frontend/src/components/Navigation.tsx`

**Add Link:**
```typescript
<nav>
  <Link to="/">Home</Link>
  <Link to="/courses">Courses</Link>
  <Link to="/dashboard/enrollments">My Courses</Link> {/* NEW */}
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/profile">Profile</Link>
</nav>
```

---

## STEP 9: Update App.tsx Routes

**File:** `frontend/src/App.tsx`

**Add Imports:**
```typescript
import CoursePage from './pages/CoursePage';
import PaymentPage from './pages/PaymentPage';
import LessonViewer from './components/LessonViewer';
```

**Add Routes:**
```typescript
<Routes>
  {/* Existing routes */}
  
  {/* NEW: Smart Enrollment Routes */}
  <Route path="/courses/:courseId" element={<CoursePage />} />
  <Route path="/courses/:courseId/lesson/:lessonId" element={<LessonViewer />} />
  <Route path="/payment/:courseId" element={<PaymentPage />} />
  <Route path="/dashboard/enrollments" element={<Dashboard />} />
</Routes>
```

---

## STEP 10: Update Frontend .env

**File:** `frontend/.env`

**Variables:**
```env
VITE_API_URL=https://devloperameen-sesa-acadamy-4.onrender.com/api
VITE_APP_NAME=SESA Academy
VITE_APP_VERSION=2.0.0
```

---

## 🔄 API Endpoints Reference

### Smart Enrollment Endpoints

**1. Get User Enrollments**
```
GET /api/smart-enrollment/my-enrollments
Authorization: Bearer token
Response: { enrollments: [...] }
```

**2. Check Course Access**
```
GET /api/smart-enrollment/courses/:courseId/access-check
Authorization: Bearer token
Response: { hasAccess, accessLevel, lessonsAccessible, totalLessons }
```

**3. Get Course with Access**
```
GET /api/smart-enrollment/courses/:courseId/with-access
Authorization: Bearer token (optional)
Response: { course: { lessons: [...], userAccess: {...} } }
```

**4. Get Course Lessons**
```
GET /api/smart-enrollment/courses/:courseId/lessons
Authorization: Bearer token (optional)
Response: { lessons: [...], totalLessons, accessibleLessons }
```

**5. Get Specific Lesson**
```
GET /api/smart-enrollment/courses/:courseId/lessons/:lessonId
Authorization: Bearer token (optional)
Response: { lesson: { ...lesson, isAccessible, nextLessonId, previousLessonId } }
```

### Payment Endpoints

**1. Process Course Payment**
```
POST /api/payments/course/:courseId
Authorization: Bearer token
Body: { paymentMethod: 'manual', amount: 99.99 }
Response: { success, message, payment: {...} }
```

**2. Get Payment History**
```
GET /api/payments/my-payments
Authorization: Bearer token
Response: { payments: [...] }
```

---

## 🎨 CSS Classes Reference

```css
/* Lesson Cards */
.lesson-card { /* Normal lesson */ }
.lesson-card.locked { /* Locked lesson */ }
.lesson-card.free { /* Free lesson */ }

/* Badges */
.badge { /* Base badge */ }
.badge-paid { /* Paid access badge */ }
.badge-free { /* Free preview badge */ }

/* Buttons */
.btn-unlock { /* Unlock button */ }
.btn-continue { /* Continue button */ }
.btn-enroll { /* Enroll button */ }

/* Overlays */
.blur-overlay { /* Blur effect on locked content */ }
.lock-icon { /* Lock icon */ }

/* Progress */
.progress-bar { /* Progress bar */ }
.progress-bar > div { /* Progress fill */ }
```

---

## 🧪 Testing Scenarios

### Scenario 1: Free Preview
```
1. User NOT logged in → Visit /courses/:courseId
   Expected: See Lesson 1 only, login prompt
2. User logged in → Visit /courses/:courseId
   Expected: See Lesson 1 (FREE PREVIEW), locked lessons
```

### Scenario 2: Paid Enrollment
```
1. User clicks "Unlock Full Course"
   Expected: Redirect to /payment/:courseId
2. Complete payment
   Expected: Redirect to /courses/:courseId with all lessons unlocked
3. Visit course again
   Expected: All lessons accessible, no unlock button
```

### Scenario 3: Multiple Courses
```
1. User enrolls in Course A
   Expected: Can access Course A only
2. User tries to access Course B
   Expected: See free preview only
3. User enrolls in Course B
   Expected: Can access Course B, still only Course A from before
```

---

## 📊 Component Hierarchy

```
App
├── Navigation
├── Routes
│   ├── CoursePage
│   │   ├── CourseHeader
│   │   ├── LessonList
│   │   │   ├── FreeLesson
│   │   │   └── LockedLessonCard
│   │   └── UnlockButton
│   ├── LessonViewer
│   │   ├── VideoPlayer
│   │   ├── LessonContent
│   │   └── Navigation (prev/next)
│   ├── PaymentPage
│   │   ├── PaymentForm
│   │   ├── PriceDisplay
│   │   └── ConfirmationMessage
│   └── Dashboard
│       └── EnrollmentCard (multiple)
└── Footer
```

---

## ✅ Frontend Checklist

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
- [ ] All API calls working
- [ ] All components styled
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Accessibility checked

---

## 🚀 Deployment

### Local Testing
```bash
cd frontend
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
git add .
git commit -m "feat: implement smart enrollment frontend - phase 3"
git push origin main
# Vercel auto-deploys
```

---

## 📝 Summary

**Phase 3 Frontend Implementation:**
- ✅ 5 new components
- ✅ 4 updated components
- ✅ Dynamic routing
- ✅ Payment flow
- ✅ Access control UI
- ✅ Progress tracking
- ✅ Responsive design

**Status:** Ready to implement 🚀
