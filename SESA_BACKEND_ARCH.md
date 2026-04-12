# SESA ACADEMY - BACKEND ARCHITECTURE & IMPLEMENTATION

---

# PART 4: BACKEND ARCHITECTURE

## 1. PROJECT STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── email.ts
│   │   └── payment.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   ├── logging.ts
│   │   └── courseAccess.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Course.ts
│   │   ├── Lesson.ts
│   │   ├── Enrollment.ts
│   │   ├── Payment.ts
│   │   ├── Quiz.ts
│   │   ├── Assignment.ts
│   │   ├── Forum.ts
│   │   ├── Notification.ts
│   │   └── Analytics.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── courseController.ts
│   │   ├── enrollmentController.ts
│   │   ├── paymentController.ts
│   │   ├── quizController.ts
│   │   ├── assignmentController.ts
│   │   ├── forumController.ts
│   │   ├── analyticsController.ts
│   │   ├── smartEnrollmentController.ts
│   │   └── aiTutorController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── courseService.ts
│   │   ├── enrollmentService.ts
│   │   ├── paymentService.ts
│   │   ├── emailService.ts
│   │   ├── analyticsService.ts
│   │   ├── cacheService.ts
│   │   ├── gamificationService.ts
│   │   └── aiTutorService.ts
│   ├── repositories/
│   │   ├── userRepository.ts
│   │   ├── courseRepository.ts
│   │   ├── enrollmentRepository.ts
│   │   ├── paymentRepository.ts
│   │   └── baseRepository.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── courses.ts
│   │   ├── enrollments.ts
│   │   ├── payments.ts
│   │   ├── quizzes.ts
│   │   ├── assignments.ts
│   │   ├── forums.ts
│   │   ├── analytics.ts
│   │   ├── smartEnrollment.ts
│   │   └── aiTutor.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   ├── constants.ts
│   │   ├── jwt.ts
│   │   └── errorHandler.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── course.ts
│   │   ├── payment.ts
│   │   └── api.ts
│   ├── jobs/
│   │   ├── emailQueue.ts
│   │   ├── analyticsQueue.ts
│   │   └── notificationQueue.ts
│   ├── index.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. MIDDLEWARE STACK

### 2.1 Authentication Middleware

```typescript
// middleware/auth.ts
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
```

### 2.2 Error Handling Middleware

```typescript
// middleware/errorHandler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }
  
  logger.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};
```

### 2.3 Validation Middleware

```typescript
// middleware/validation.ts
export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    
    req.body = value;
    next();
  };
};
```

---

## 3. SERVICE LAYER

### 3.1 Course Service

```typescript
// services/courseService.ts
class CourseService {
  constructor(private courseRepository: CourseRepository) {}
  
  async createCourse(data: CreateCourseData, instructorId: string): Promise<Course> {
    const course = new Course({
      ...data,
      instructor: instructorId,
      status: 'draft'
    });
    
    return this.courseRepository.create(course);
  }
  
  async publishCourse(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new AppError(404, 'Course not found');
    }
    
    course.status = 'published';
    return this.courseRepository.update(courseId, course);
  }
  
  async getCourseWithAccess(courseId: string, userId?: string): Promise<CourseWithAccess> {
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new AppError(404, 'Course not found');
    }
    
    let accessLevel: AccessLevel = 'none';
    
    if (!userId) {
      // Check if course has free lessons
      accessLevel = course.lessons.some(l => l.isFree) ? 'free' : 'none';
    } else {
      // Check user enrollment
      const enrollment = await enrollmentRepository.findOne({
        user: userId,
        course: courseId
      });
      
      if (enrollment?.status === 'approved') {
        accessLevel = enrollment.accessLevel;
      } else if (course.lessons.some(l => l.isFree)) {
        accessLevel = 'free';
      }
    }
    
    // Filter lessons based on access
    const lessons = course.lessons.map(lesson => ({
      ...lesson,
      isAccessible: accessLevel === 'paid' || lesson.isFree
    }));
    
    return {
      ...course,
      lessons,
      userAccess: {
        accessLevel,
        hasPaidAccess: accessLevel === 'paid'
      }
    };
  }
}
```

### 3.2 Payment Service

```typescript
// services/paymentService.ts
class PaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private enrollmentService: EnrollmentService
  ) {}
  
  async processPayment(paymentData: PaymentData): Promise<Payment> {
    // Validate payment
    const course = await courseRepository.findById(paymentData.courseId);
    if (!course) {
      throw new AppError(404, 'Course not found');
    }
    
    if (paymentData.amount !== course.price) {
      throw new AppError(400, 'Invalid payment amount');
    }
    
    // Process with payment gateway
    const result = await this.processWithGateway(paymentData);
    
    if (!result.success) {
      throw new AppError(400, 'Payment processing failed');
    }
    
    // Create payment record
    const payment = new Payment({
      ...paymentData,
      status: 'completed',
      transactionId: result.transactionId,
      paymentDate: new Date()
    });
    
    const savedPayment = await this.paymentRepository.create(payment);
    
    // Create enrollment
    await this.enrollmentService.createEnrollment({
      user: paymentData.userId,
      course: paymentData.courseId,
      accessLevel: 'paid',
      status: 'approved'
    });
    
    return savedPayment;
  }
  
  private async processWithGateway(data: PaymentData): Promise<GatewayResult> {
    switch (data.paymentMethod) {
      case 'stripe':
        return this.processStripe(data);
      case 'paypal':
        return this.processPayPal(data);
      case 'manual':
        return { success: true, transactionId: `TXN-${Date.now()}` };
      default:
        throw new AppError(400, 'Unsupported payment method');
    }
  }
}
```

### 3.3 Enrollment Service

```typescript
// services/enrollmentService.ts
class EnrollmentService {
  constructor(private enrollmentRepository: EnrollmentRepository) {}
  
  async createEnrollment(data: EnrollmentData): Promise<Enrollment> {
    // Check if already enrolled
    const existing = await this.enrollmentRepository.findOne({
      user: data.user,
      course: data.course
    });
    
    if (existing) {
      throw new AppError(400, 'Already enrolled in this course');
    }
    
    const enrollment = new Enrollment({
      ...data,
      enrolledAt: new Date()
    });
    
    return this.enrollmentRepository.create(enrollment);
  }
  
  async getStudentEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({ user: userId });
  }
  
  async updateProgress(enrollmentId: string, progress: number): Promise<Enrollment> {
    return this.enrollmentRepository.update(enrollmentId, { progress });
  }
}
```

---

## 4. REPOSITORY PATTERN

### 4.1 Base Repository

```typescript
// repositories/baseRepository.ts
abstract class BaseRepository<T> {
  constructor(protected model: Model<T>) {}
  
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }
  
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }
  
  async find(filter: any): Promise<T[]> {
    return this.model.find(filter);
  }
  
  async findOne(filter: any): Promise<T | null> {
    return this.model.findOne(filter);
  }
  
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }
  
  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
  
  async count(filter: any): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
```

### 4.2 Course Repository

```typescript
// repositories/courseRepository.ts
class CourseRepository extends BaseRepository<Course> {
  constructor() {
    super(Course);
  }
  
  async findByInstructor(instructorId: string): Promise<Course[]> {
    return this.model.find({ instructor: instructorId });
  }
  
  async findByCategory(category: string): Promise<Course[]> {
    return this.model.find({ category });
  }
  
  async search(query: string): Promise<Course[]> {
    return this.model.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
  }
  
  async getPopular(limit: number = 10): Promise<Course[]> {
    return this.model
      .find({ status: 'active' })
      .sort({ enrolledStudents: -1 })
      .limit(limit);
  }
}
```

---

## 5. CONTROLLER LAYER

### 5.1 Course Controller

```typescript
// controllers/courseController.ts
export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const courseData = req.body;
    const instructorId = req.user!.id;
    
    const course = await courseService.createCourse(courseData, instructorId);
    
    res.status(201).json({
      status: 'success',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user?.id;
    
    const course = await courseService.getCourseWithAccess(id, userId);
    
    res.json({
      status: 'success',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verify ownership
    const course = await courseRepository.findById(id);
    if (course?.instructor.toString() !== req.user!.id) {
      throw new AppError(403, 'Unauthorized');
    }
    
    const updated = await courseService.updateCourse(id, updateData);
    
    res.json({
      status: 'success',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 6. ROUTE CONFIGURATION

### 6.1 Course Routes

```typescript
// routes/courses.ts
const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authenticate, authorize(['instructor']), createCourse);
router.put('/:id', authenticate, authorize(['instructor']), updateCourse);
router.delete('/:id', authenticate, authorize(['instructor']), deleteCourse);

export default router;
```

### 6.2 Smart Enrollment Routes

```typescript
// routes/smartEnrollment.ts
const router = express.Router();

router.get('/my-enrollments', authenticate, getMyEnrollments);
router.get('/courses/:courseId/with-access', getCourseWithAccess);
router.get('/courses/:courseId/lessons/:lessonId', getLesson);
router.post('/check-access', authenticate, checkAccess);

export default router;
```

---

## 7. DATABASE INDEXING

### 7.1 Index Strategy

```typescript
// models/Course.ts
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ createdAt: -1 });

// models/Enrollment.ts
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ user: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });

// models/Payment.ts
paymentSchema.index({ user: 1, course: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
```

---

## 8. CACHING STRATEGY

### 8.1 Redis Cache

```typescript
// services/cacheService.ts
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage in CourseService
async getCourse(id: string): Promise<Course> {
  const cached = await cacheService.get(`course:${id}`);
  if (cached) return cached;
  
  const course = await courseRepository.findById(id);
  await cacheService.set(`course:${id}`, course);
  return course;
}
```

---

## 9. QUEUE MANAGEMENT

### 9.1 Email Queue

```typescript
// jobs/emailQueue.ts
const emailQueue = new Queue('email', {
  redis: { host: 'localhost', port: 6379 }
});

emailQueue.process(async (job) => {
  const { to, subject, template, data } = job.data;
  
  const html = await renderTemplate(template, data);
  await emailService.send({ to, subject, html });
});

// Add job
emailQueue.add({
  to: user.email,
  subject: 'Welcome to SESA Academy',
  template: 'welcome',
  data: { name: user.firstName }
});
```

---

## 10. LOGGING & MONITORING

### 10.1 Winston Logger

```typescript
// utils/logger.ts
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

---

## 11. TESTING

### 11.1 Unit Test Example

```typescript
// tests/unit/courseService.test.ts
describe('CourseService', () => {
  let courseService: CourseService;
  let courseRepository: MockCourseRepository;
  
  beforeEach(() => {
    courseRepository = new MockCourseRepository();
    courseService = new CourseService(courseRepository);
  });
  
  it('should create a course', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      price: 99
    };
    
    const course = await courseService.createCourse(courseData, 'instructor-id');
    
    expect(course).toBeDefined();
    expect(course.title).toBe('Test Course');
  });
});
```

---

## 12. DEPLOYMENT CONFIGURATION

### 12.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

### 12.2 Environment Configuration

```bash
# .env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sesa
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password
```

---

**END OF PART 4**

---

## SUMMARY

This comprehensive specification covers:

1. **Part 1**: Complete project requirements, features, and technology stack
2. **Part 2**: OOAD analysis with class diagrams, design patterns, and architecture
3. **Part 3**: Frontend architecture with React components, state management, and routing
4. **Part 4**: Backend architecture with services, repositories, and deployment

All components are designed with:
- ✅ Scalability
- ✅ Maintainability
- ✅ Security
- ✅ Performance
- ✅ Accessibility
- ✅ Testing
- ✅ Monitoring

**Total Implementation Effort**: 7 months (3 phases)
**Team Size**: 8-10 developers
**Estimated Cost**: $150,000 - $250,000
