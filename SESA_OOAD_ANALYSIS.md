# SESA ACADEMY - OOAD ANALYSIS & SYSTEM DESIGN

---

# PART 2: OBJECT-ORIENTED ANALYSIS & DESIGN

## 1. DOMAIN ANALYSIS

### 1.1 Core Domain Entities

#### User Domain
- **User**: Base entity for all system users
- **Student**: Extends User, manages enrollments
- **Instructor**: Extends User, creates courses
- **Admin**: Extends User, manages platform
- **FinanceManager**: Extends User, manages payments

#### Course Domain
- **Course**: Main learning unit
- **Lesson**: Component of course
- **Category**: Course classification
- **Resource**: Learning materials
- **Review**: Course feedback

#### Enrollment Domain
- **Enrollment**: Student-Course relationship
- **Payment**: Transaction record
- **AccessLevel**: Determines content visibility
- **Progress**: Learning progress tracking

#### Assessment Domain
- **Quiz**: Assessment tool
- **Question**: Quiz component
- **Assignment**: Submission-based assessment
- **Submission**: Student work
- **Grade**: Assessment result

#### Collaboration Domain
- **Forum**: Discussion space
- **Thread**: Discussion topic
- **Post**: Forum message
- **StudyGroup**: Peer learning group

---

## 2. CLASS DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         <<abstract>>                             │
│                            User                                  │
├─────────────────────────────────────────────────────────────────┤
│ - id: ObjectId                                                  │
│ - email: String                                                 │
│ - password: String                                              │
│ - firstName: String                                             │
│ - lastName: String                                              │
│ - role: UserRole                                                │
│ - createdAt: Date                                               │
├─────────────────────────────────────────────────────────────────┤
│ + register(): void                                              │
│ + login(): JWT                                                  │
│ + updateProfile(): void                                         │
│ + logout(): void                                                │
└─────────────────────────────────────────────────────────────────┘
         △                    △                    △
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐         ┌────┴────┐
    │ Student │          │Instructor│        │  Admin  │
    └─────────┘          └──────────┘        └─────────┘
         │                    │                    │
    enrollments          courses              manages
         │                    │                    │
         ▼                    ▼                    ▼
    ┌──────────────────────────────────────────────────┐
    │                  Course                          │
    ├──────────────────────────────────────────────────┤
    │ - id: ObjectId                                   │
    │ - title: String                                  │
    │ - description: String                            │
    │ - instructor: User                               │
    │ - price: Number                                  │
    │ - lessons: Lesson[]                              │
    │ - enrolledStudents: Student[]                    │
    │ - status: CourseStatus                           │
    ├──────────────────────────────────────────────────┤
    │ + createLesson(): Lesson                         │
    │ + publishCourse(): void                          │
    │ + getEnrolledStudents(): Student[]               │
    │ + calculateRating(): Number                      │
    └──────────────────────────────────────────────────┘
         │
         │ contains
         ▼
    ┌──────────────────────────────────────────────────┐
    │                  Lesson                          │
    ├──────────────────────────────────────────────────┤
    │ - id: ObjectId                                   │
    │ - title: String                                  │
    │ - order: Number                                  │
    │ - videoUrl: String                               │
    │ - isFree: Boolean                                │
    │ - resources: Resource[]                          │
    ├──────────────────────────────────────────────────┤
    │ + getAccessLevel(user): AccessLevel              │
    │ + isAccessible(user): Boolean                    │
    └──────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────┐
    │                Enrollment                        │
    ├──────────────────────────────────────────────────┤
    │ - id: ObjectId                                   │
    │ - student: Student                               │
    │ - course: Course                                 │
    │ - accessLevel: AccessLevel                       │
    │ - status: EnrollmentStatus                       │
    │ - enrolledAt: Date                               │
    ├──────────────────────────────────────────────────┤
    │ + approve(): void                                │
    │ + reject(): void                                 │
    │ + getProgress(): Number                          │
    │ + isActive(): Boolean                            │
    └──────────────────────────────────────────────────┘
         │
         │ processes
         ▼
    ┌──────────────────────────────────────────────────┐
    │                 Payment                          │
    ├──────────────────────────────────────────────────┤
    │ - id: ObjectId                                   │
    │ - user: User                                     │
    │ - course: Course                                 │
    │ - amount: Number                                 │
    │ - method: PaymentMethod                          │
    │ - status: PaymentStatus                          │
    │ - transactionId: String                          │
    ├──────────────────────────────────────────────────┤
    │ + process(): Boolean                             │
    │ + confirm(): void                                │
    │ + refund(): void                                 │
    │ + getReceipt(): Receipt                          │
    └──────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────┐
    │                   Quiz                           │
    ├──────────────────────────────────────────────────┤
    │ - id: ObjectId                                   │
    │ - course: Course                                 │
    │ - questions: Question[]                          │
    │ - timeLimit: Number                              │
    │ - passingScore: Number                           │
    ├──────────────────────────────────────────────────┤
    │ + submit(answers): QuizResult                    │
    │ + calculateScore(): Number                       │
    │ + getResult(): QuizResult                        │
    └──────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────┐
    │                Assignment                        │
    ├──────────────────────────────────────────────────┤
    │ - id: ObjectId                                   │
    │ - course: Course                                 │
    │ - title: String                                  │
    │ - dueDate: Date                                  │
    │ - submissions: Submission[]                      │
    ├──────────────────────────────────────────────────┤
    │ + submit(content): Submission                    │
    │ + grade(submission): void                        │
    │ + getSubmissions(): Submission[]                 │
    └──────────────────────────────────────────────────┘
```

---

## 3. USE CASE DIAGRAM

```
                    ┌─────────────────────────────────┐
                    │      SESA Academy System         │
                    └─────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
            ┌───────┐         ┌────────┐       ┌────────┐
            │Student│         │Instructor      │ Admin  │
            └───────┘         └────────┘       └────────┘
                │                 │                 │
                │                 │                 │
        ┌───────┴─────────┐   ┌────┴────┐    ┌────┴────┐
        │                 │   │          │    │         │
    ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Browse Courses   │Create Course  │Approve Course
    └─────────────┘  └──────────┘  └──────────┘
        │                 │              │
    ┌─────────────┐  ┌──────────┐  ┌──────────┐
    │View Lesson  │  │Upload Video  │Manage Users
    └─────────────┘  └──────────┘  └──────────┘
        │                 │              │
    ┌─────────────┐  ┌──────────┐  ┌──────────┐
    │Enroll Course    │Create Quiz   │View Analytics
    └─────────────┘  └──────────┘  └──────────┘
        │                 │              │
    ┌─────────────┐  ┌──────────┐  ┌──────────┐
    │Make Payment │  │Grade Assignment  │Manage Payments
    └─────────────┘  └──────────┘  └──────────┘
        │                 │              │
    ┌─────────────┐  ┌──────────┐  ┌──────────┐
    │Take Quiz    │  │View Student Progress  │Generate Reports
    └─────────────┘  └──────────┘  └──────────┘
        │                 │
    ┌─────────────┐  ┌──────────┐
    │Submit Assignment  │Manage Forum
    └─────────────┘  └──────────┘
        │
    ┌─────────────┐
    │View Progress    │
    └─────────────┘
```

---

## 4. SEQUENCE DIAGRAMS

### 4.1 Course Enrollment Sequence

```
Student          Frontend         Backend          Database
   │                │                │                │
   │─ Browse Courses─>│                │                │
   │                │─ GET /courses ─>│                │
   │                │                │─ Query Courses─>│
   │                │                │<─ Return Data ─│
   │                │<─ Display List ─│                │
   │                │                │                │
   │─ Select Course─>│                │                │
   │                │─ GET /courses/:id/with-access ─>│
   │                │                │─ Check Access ─>│
   │                │                │<─ Access Info ─│
   │                │<─ Show Details ─│                │
   │                │                │                │
   │─ Enroll Course─>│                │                │
   │                │─ POST /payments/course/:id ─>│
   │                │                │─ Create Payment─>│
   │                │                │<─ Payment ID ─│
   │                │<─ Payment Confirmation ─│        │
   │                │                │                │
   │─ Confirm Payment─>│              │                │
   │                │─ POST /payments/:id/confirm ─>│
   │                │                │─ Update Status ─>│
   │                │                │<─ Success ─│
   │                │                │─ Create Enrollment ─>│
   │                │                │<─ Enrollment ID ─│
   │                │<─ Access Granted ─│              │
   │                │                │                │
   │─ View Course ─>│                │                │
   │                │─ GET /courses/:id/lessons ─>│
   │                │                │─ Get Lessons ─>│
   │                │                │<─ Lessons ─│
   │                │<─ Display Lessons ─│            │
```

### 4.2 Quiz Submission Sequence

```
Student          Frontend         Backend          Database
   │                │                │                │
   │─ Take Quiz ───>│                │                │
   │                │─ GET /quizzes/:id ─>│          │
   │                │                │─ Get Questions ─>│
   │                │                │<─ Questions ─│
   │                │<─ Display Quiz ─│               │
   │                │                │                │
   │─ Answer Questions ─>│           │                │
   │                │                │                │
   │─ Submit Quiz ─>│                │                │
   │                │─ POST /quizzes/:id/submit ─>│
   │                │                │─ Validate Answers ─>│
   │                │                │─ Calculate Score ─>│
   │                │                │<─ Score ─│
   │                │                │─ Save Result ─>│
   │                │                │<─ Result ID ─│
   │                │<─ Show Results ─│               │
   │                │                │                │
   │─ View Results ─>│                │                │
   │                │─ GET /quizzes/:id/results ─>│
   │                │                │─ Get Results ─>│
   │                │                │<─ Results ─│
   │                │<─ Display Results ─│            │
```

---

## 5. STATE DIAGRAMS

### 5.1 Course Lifecycle

```
    ┌─────────┐
    │  Draft  │
    └────┬────┘
         │ submit
         ▼
    ┌──────────┐
    │ Pending  │
    └────┬────┘
         │ approve
         ▼
    ┌──────────┐
    │Published │
    └────┬────┘
         │ activate
         ▼
    ┌──────────┐
    │  Active  │
    └────┬────┘
         │ archive
         ▼
    ┌──────────┐
    │ Archived │
    └──────────┘
```

### 5.2 Enrollment Lifecycle

```
    ┌──────────┐
    │ Pending  │
    └────┬────┘
         │ approve
         ▼
    ┌──────────┐
    │ Approved │
    └────┬────┘
         │ expire/cancel
         ▼
    ┌──────────┐
    │ Inactive │
    └──────────┘
```

### 5.3 Payment Lifecycle

```
    ┌──────────┐
    │ Pending  │
    └────┬────┘
         │ process
         ▼
    ┌──────────┐
    │Completed │
    └────┬────┘
         │ refund
         ▼
    ┌──────────┐
    │ Refunded │
    └──────────┘
```

---

## 6. DESIGN PATTERNS

### 6.1 Creational Patterns

#### Factory Pattern
```typescript
// CourseFactory
class CourseFactory {
  static createCourse(type: 'free' | 'paid'): Course {
    if (type === 'free') {
      return new FreeCourse();
    } else {
      return new PaidCourse();
    }
  }
}
```

#### Singleton Pattern
```typescript
// DatabaseConnection
class DatabaseConnection {
  private static instance: DatabaseConnection;
  
  private constructor() {}
  
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}
```

### 6.2 Structural Patterns

#### Adapter Pattern
```typescript
// PaymentAdapter
interface PaymentGateway {
  process(amount: number): Promise<string>;
}

class StripeAdapter implements PaymentGateway {
  process(amount: number): Promise<string> {
    // Stripe implementation
  }
}

class PayPalAdapter implements PaymentGateway {
  process(amount: number): Promise<string> {
    // PayPal implementation
  }
}
```

#### Decorator Pattern
```typescript
// CourseDecorator
abstract class CourseDecorator extends Course {
  protected course: Course;
  
  constructor(course: Course) {
    super();
    this.course = course;
  }
}

class CertificateDecorator extends CourseDecorator {
  getPrice(): number {
    return this.course.getPrice() + 50;
  }
}
```

### 6.3 Behavioral Patterns

#### Observer Pattern
```typescript
// EnrollmentObserver
interface EnrollmentObserver {
  update(enrollment: Enrollment): void;
}

class EmailNotifier implements EnrollmentObserver {
  update(enrollment: Enrollment): void {
    // Send email notification
  }
}

class AnalyticsTracker implements EnrollmentObserver {
  update(enrollment: Enrollment): void {
    // Track analytics
  }
}
```

#### Strategy Pattern
```typescript
// PaymentStrategy
interface PaymentStrategy {
  pay(amount: number): Promise<boolean>;
}

class StripePayment implements PaymentStrategy {
  pay(amount: number): Promise<boolean> {
    // Stripe payment logic
  }
}

class LocalPayment implements PaymentStrategy {
  pay(amount: number): Promise<boolean> {
    // Local payment logic
  }
}
```

#### State Pattern
```typescript
// CourseState
interface CourseState {
  publish(): void;
  archive(): void;
}

class DraftState implements CourseState {
  publish(): void {
    // Transition to Published
  }
}

class PublishedState implements CourseState {
  archive(): void {
    // Transition to Archived
  }
}
```

---

## 7. ARCHITECTURE PATTERNS

### 7.1 Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components, UI, Controllers)    │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (Services, Use Cases, Validators)      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (Repositories, DAOs, Models)           │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Database Layer                  │
│  (MongoDB, Redis, External APIs)        │
└─────────────────────────────────────────┘
```

### 7.2 MVC Architecture (Frontend)

```
┌──────────────────────────────────────────┐
│            View (React)                  │
│  - Components                            │
│  - Pages                                 │
│  - Styling                               │
└──────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────┐
│         Controller (Hooks)               │
│  - State Management                      │
│  - Event Handling                        │
│  - Business Logic                        │
└──────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────┐
│          Model (Services)                │
│  - API Calls                             │
│  - Data Transformation                   │
│  - Caching                               │
└──────────────────────────────────────────┘
```

### 7.3 Repository Pattern (Backend)

```
┌──────────────────────────────────────────┐
│         Service Layer                    │
│  - Business Logic                        │
│  - Validation                            │
│  - Orchestration                         │
└──────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────┐
│      Repository Interface                │
│  - Abstract Data Access                  │
└──────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────┐
│    Repository Implementation             │
│  - MongoDB Implementation                │
│  - Query Building                        │
│  - Data Mapping                          │
└──────────────────────────────────────────┘
                    │
┌──────────────────────────────────────────┐
│         Database                         │
│  - MongoDB Collections                   │
│  - Indexes                               │
│  - Transactions                          │
└──────────────────────────────────────────┘
```

---

## 8. DEPENDENCY INJECTION

### 8.1 Backend DI Container

```typescript
// DIContainer
class DIContainer {
  private services: Map<string, any> = new Map();
  
  register(name: string, factory: () => any): void {
    this.services.set(name, factory);
  }
  
  resolve(name: string): any {
    const factory = this.services.get(name);
    return factory ? factory() : null;
  }
}

// Usage
const container = new DIContainer();
container.register('userRepository', () => new UserRepository());
container.register('userService', () => 
  new UserService(container.resolve('userRepository'))
);
```

---

## 9. ERROR HANDLING STRATEGY

### 9.1 Custom Error Classes

```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

class UnauthorizedError extends AppError {
  constructor() {
    super(401, 'Unauthorized access');
  }
}
```

---

## 10. TRANSACTION MANAGEMENT

### 10.1 Payment Transaction Flow

```typescript
async function processPayment(payment: Payment): Promise<void> {
  const session = await db.startSession();
  session.startTransaction();
  
  try {
    // 1. Create payment record
    await Payment.create([payment], { session });
    
    // 2. Update user enrollment
    await User.updateOne(
      { _id: payment.userId },
      { $push: { courseEnrollments: {...} } },
      { session }
    );
    
    // 3. Update course enrollment count
    await Course.updateOne(
      { _id: payment.courseId },
      { $push: { enrolledStudents: payment.userId } },
      { session }
    );
    
    // 4. Create notification
    await Notification.create([notification], { session });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
```

---

## 11. CACHING STRATEGY

### 11.1 Redis Caching

```typescript
// CacheService
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

// Usage
const courseCache = await cacheService.get(`course:${courseId}`);
if (!courseCache) {
  const course = await courseRepository.findById(courseId);
  await cacheService.set(`course:${courseId}`, course);
}
```

---

## 12. VALIDATION STRATEGY

### 12.1 Input Validation

```typescript
// Validation Schemas
const courseSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(1000),
  price: Joi.number().required().min(0),
  gradeLevel: Joi.string().required().valid('8', '9', '10', '11', '12'),
  level: Joi.string().required().valid('Beginner', 'Intermediate', 'Advanced')
});

// Validation Middleware
const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    req.body = value;
    next();
  };
};
```

---

## 13. LOGGING STRATEGY

### 13.1 Structured Logging

```typescript
// Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('User registered', { userId, email });
logger.error('Payment failed', { paymentId, error });
logger.warn('High memory usage', { memory: process.memoryUsage() });
```

---

## 14. TESTING ARCHITECTURE

### 14.1 Test Pyramid

```
        ▲
       ╱ ╲
      ╱   ╲  E2E Tests (10%)
     ╱─────╲
    ╱       ╲
   ╱         ╲ Integration Tests (30%)
  ╱───────────╲
 ╱             ╲
╱               ╲ Unit Tests (60%)
─────────────────
```

### 14.2 Test Structure

```typescript
// Unit Test Example
describe('CourseService', () => {
  let courseService: CourseService;
  let courseRepository: MockCourseRepository;
  
  beforeEach(() => {
    courseRepository = new MockCourseRepository();
    courseService = new CourseService(courseRepository);
  });
  
  it('should create a course', async () => {
    const course = await courseService.createCourse({...});
    expect(course).toBeDefined();
    expect(course.title).toBe('Test Course');
  });
});
```

---

**END OF PART 2**
