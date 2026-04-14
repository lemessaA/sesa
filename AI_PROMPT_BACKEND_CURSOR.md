# ⚙️ SESA ACADEMY - BACKEND AI PROMPT FOR CURSOR

## PROJECT CONTEXT

You are building the **SESA Academy** backend - a revolutionary AI-powered educational platform. This is a Node.js + Express + TypeScript application with advanced features including smart enrollment, AI tutoring, real-time collaboration, advanced analytics, and enterprise-grade security.

---

## TECH STACK

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Atlas)
- **Cache:** Redis
- **Authentication:** JWT + OAuth
- **AI:** Google Gemini API + OpenAI
- **Real-time:** Socket.io
- **Logging:** Winston
- **Email:** Nodemailer
- **Payment:** Stripe, PayPal
- **Testing:** Jest + Supertest

---

## PROJECT STRUCTURE

```
backend/
├── src/
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── models/              # MongoDB schemas
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── repositories/        # Data access layer
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   ├── jobs/                # Background jobs
│   ├── index.ts             # Entry point
│   └── app.ts               # Express app setup
├── tests/                   # Test files
├── .env                     # Environment variables
└── package.json
```

---

## CORE FEATURES TO IMPLEMENT

### 1. SMART ENROLLMENT SYSTEM

**Purpose:** Manage course access with free/paid tiers and payment processing

**Files to Create/Modify:**
- `controllers/smartEnrollmentController.ts` - ✅ DONE
- `routes/smartEnrollment.ts` - ✅ DONE
- `middleware/courseAccess.ts` - ✅ DONE
- `models/User.ts` - ✅ UPDATED
- `models/Payment.ts` - ✅ CREATED

**API Endpoints (5 total):**
```
GET  /api/smart-enrollment/my-enrollments
GET  /api/smart-enrollment/courses/:courseId/access-check
GET  /api/smart-enrollment/courses/:courseId/with-access
GET  /api/smart-enrollment/courses/:courseId/lessons
GET  /api/smart-enrollment/courses/:courseId/lessons/:lessonId
```

**Data Models:**
```typescript
// User.courseEnrollments
interface ICourseEnrollment {
  courseId: ObjectId;
  enrollmentDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  accessLevel: 'free' | 'paid';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  expiresAt?: Date;
  paymentId?: ObjectId;
}

// Payment
interface IPayment {
  userId: ObjectId;
  courseId: ObjectId;
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'manual';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  paymentDate: Date;
}
```

**Key Logic:**
- Check if lesson has `isFree: true` flag
- If free → allow access for authenticated users
- If paid → verify enrollment with `accessLevel: 'paid'`
- Return 403 Forbidden for unauthorized access
- Maintain backward compatibility with existing enrolledCourses

---

### 2. AI TUTOR SYSTEM

**Purpose:** Provide personalized AI-powered tutoring sessions

**Files to Create/Modify:**
- `controllers/aiTutorController.ts` - ✅ DONE
- `routes/aiTutor.ts` - ✅ DONE
- `services/aiTutorService.ts` - Ready to enhance
- `models/Progress.ts` - Existing

**API Endpoints (5 total):**
```
POST /api/ai-tutor/session/start
POST /api/ai-tutor/session/chat
POST /api/ai-tutor/quiz/generate
POST /api/ai-tutor/study-plan
POST /api/ai-tutor/session/end
```

**Session Structure:**
```typescript
interface LearningSession {
  userId: string;
  courseId: string;
  messages: ChatMessage[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  currentTopic: string;
  strugglingAreas: string[];
  strengths: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
```

**Features:**
- Initialize session with user profile
- Generate personalized welcome message
- Process user messages with context
- Generate quizzes from conversation
- Create study plans based on progress
- Track learning insights
- Provide session summary

**Implementation Details:**
- Use Google Gemini API for AI responses
- Store sessions in Redis (in-memory for now)
- Implement session timeout (30 minutes)
- Track struggling areas and strengths
- Generate contextual prompts based on course content

---

### 3. REAL-TIME COLLABORATION

**Purpose:** Enable real-time study room collaboration

**Files to Create/Modify:**
- `controllers/collaborationController.ts` - ✅ DONE
- `routes/collaboration.ts` - ✅ DONE
- Socket.io event handlers
- `models/StudyRoom.ts` - Ready to create

**API Endpoints (4 total):**
```
POST /api/collaboration/rooms
PUT  /api/collaboration/rooms/:id/whiteboard
POST /api/collaboration/rooms/:id/messages
GET  /api/collaboration/rooms/:id
```

**Socket.io Events:**
```
room:join
room:leave
whiteboard:draw
whiteboard:clear
message:send
participant:update
```

**Features:**
- Create and manage study rooms
- Real-time whiteboard synchronization
- Live chat with message history
- Participant tracking
- Room analytics
- Auto-cleanup for inactive rooms

---

### 4. ADVANCED ANALYTICS

**Purpose:** Provide ML-powered learning insights

**Files to Create/Modify:**
- `controllers/advancedAnalyticsController.ts` - ✅ DONE
- `routes/advancedAnalytics.ts` - ✅ DONE
- `services/analyticsService.ts` - Ready to enhance
- `models/Analytics.ts` - Existing

**API Endpoints (3 total):**
```
GET /api/advanced-analytics/learning-patterns
GET /api/advanced-analytics/predictions
GET /api/advanced-analytics/realtime
```

**Analytics Data:**
```typescript
interface LearningPattern {
  userId: string;
  courseId: string;
  averageSessionDuration: number;
  completionRate: number;
  quizPerformance: number;
  engagementScore: number;
  learningVelocity: number;
}

interface Prediction {
  userId: string;
  courseId: string;
  completionProbability: number;
  estimatedCompletionDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}
```

**Features:**
- Analyze learning patterns with ML
- Predict completion rates
- Identify at-risk students
- Generate personalized recommendations
- Track real-time platform metrics
- Forecast engagement trends

---

### 5. PAYMENT PROCESSING

**Purpose:** Handle course payments securely

**Files to Create/Modify:**
- `controllers/paymentController.ts` - ✅ UPDATED
- `routes/payments.ts` - ✅ UPDATED
- `services/paymentService.ts` - Ready to enhance

**API Endpoints:**
```
POST /api/payments/course/:courseId
GET  /api/payments/history
GET  /api/payments/:transactionId
```

**Payment Flow:**
1. User initiates payment for course
2. Create Payment record with status='pending'
3. Process payment via Stripe/PayPal
4. Update Payment status to 'completed'
5. Add to User.courseEnrollments with accessLevel='paid'
6. Send confirmation email
7. Return transaction details

**Security:**
- Verify user authentication
- Validate course exists
- Check for duplicate payments
- Use transaction IDs for idempotency
- Log all payment attempts
- Encrypt sensitive data

---

## MIDDLEWARE STACK

### Authentication
```typescript
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Authorization
```typescript
export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

### Course Access
```typescript
export const checkCourseAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { courseId } = req.params;
  const userId = req.user?.id;
  
  // Check if lesson is free or user has paid access
  // Attach access info to request
  // Return 403 if unauthorized
};
```

### Error Handling
```typescript
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
};
```

### Validation
```typescript
export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    req.body = value;
    next();
  };
};
```

---

## SERVICE LAYER PATTERN

```typescript
// services/courseService.ts
export class CourseService {
  async getCourseWithAccess(courseId: string, userId?: string) {
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    
    let accessInfo = { hasAccess: false, accessLevel: 'none' };
    
    if (userId) {
      const user = await User.findById(userId);
      const enrollment = user?.courseEnrollments?.find(
        e => e.courseId.toString() === courseId
      );
      
      if (enrollment?.accessLevel === 'paid') {
        accessInfo = { hasAccess: true, accessLevel: 'paid' };
      }
    }
    
    return { course, accessInfo };
  }
}
```

---

## REPOSITORY PATTERN

```typescript
// repositories/courseRepository.ts
export class CourseRepository extends BaseRepository<ICourse> {
  constructor() {
    super(Course);
  }
  
  async findWithLessons(courseId: string) {
    return this.model.findById(courseId).populate('lessons');
  }
  
  async findFreeLessons(courseId: string) {
    return this.model.findById(courseId).select('lessons').lean();
  }
}
```

---

## ERROR HANDLING

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

// Usage
throw new AppError('Course not found', 404);
throw new AppError('Unauthorized access', 403);
throw new AppError('Invalid payment', 400);
```

---

## LOGGING

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('User logged in', { userId: user.id });
logger.error('Payment failed', { error: err.message });
```

---

## DATABASE INDEXES

```typescript
// User model
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ courseEnrollments.courseId: 1 });

// Payment model
paymentSchema.index({ userId: 1, courseId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

// Course model
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ instructor: 1 });
```

---

## ENVIRONMENT VARIABLES

```
# Server
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sesa

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# AI APIs
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Payment
STRIPE_SECRET_KEY=your_key
PAYPAL_CLIENT_ID=your_id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## TESTING STRATEGY

```typescript
// tests/integration/smartEnrollment.test.ts
describe('Smart Enrollment', () => {
  it('should get user enrollments', async () => {
    const response = await request(app)
      .get('/api/smart-enrollment/my-enrollments')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.enrollments).toBeArray();
  });
  
  it('should check course access', async () => {
    const response = await request(app)
      .get(`/api/smart-enrollment/courses/${courseId}/access-check`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.accessInfo).toBeDefined();
  });
});
```

---

## DEPLOYMENT CHECKLIST

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Redis cache configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Logging configured
- [ ] Error tracking (Sentry) setup
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] Load balancing configured
- [ ] CDN for static assets

---

## PERFORMANCE OPTIMIZATION

- Database query optimization with indexes
- Redis caching for frequently accessed data
- Pagination for large result sets
- Compression middleware (gzip)
- Connection pooling for database
- Rate limiting to prevent abuse
- Async job processing for heavy tasks
- Query result caching

---

## SECURITY BEST PRACTICES

- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Course-specific access enforcement
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ HTTPS enforcement
- ✅ Secure password hashing (bcrypt)
- ✅ Audit logging for sensitive operations

---

## COMMON PATTERNS

### Async Controller
```typescript
export const getEnrollments = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const enrollments = await courseService.getUserEnrollments(req.user!.id);
    res.json({ success: true, enrollments });
  } catch (error) {
    next(error);
  }
};
```

### Service Method
```typescript
async getUserEnrollments(userId: string) {
  const user = await User.findById(userId).select('courseEnrollments');
  if (!user) throw new AppError('User not found', 404);
  return user.courseEnrollments || [];
}
```

### Route Definition
```typescript
router.get('/my-enrollments', authenticate, getEnrollments);
router.post('/course/:courseId', authenticate, processPayment);
```

---

## IMPORTANT NOTES

1. **Always authenticate** before accessing user data
2. **Validate all inputs** with Joi or similar
3. **Use transactions** for multi-step operations
4. **Log all errors** with context
5. **Handle async errors** with try-catch
6. **Use TypeScript strictly** - no implicit any
7. **Follow naming conventions** - camelCase for functions
8. **Document complex logic** with comments
9. **Test edge cases** thoroughly
10. **Monitor performance** in production

---

## QUICK REFERENCE

**Start Development:**
```bash
npm install
npm run dev
```

**Build for Production:**
```bash
npm run build
npm start
```

**Run Tests:**
```bash
npm run test
npm run test:watch
```

**Lint & Format:**
```bash
npm run lint
npm run format
```

---

**Last Updated:** April 12, 2026
**Status:** Production Ready
**Version:** 1.0.0
