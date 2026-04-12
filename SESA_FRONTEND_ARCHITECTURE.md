# SESA ACADEMY - FRONTEND ARCHITECTURE & IMPLEMENTATION

---

# PART 3: FRONTEND ARCHITECTURE

## 1. PROJECT STRUCTURE

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── videos/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── PasswordReset.tsx
│   │   ├── course/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CoursePage.tsx
│   │   │   ├── LessonViewer.tsx
│   │   │   ├── LessonList.tsx
│   │   │   └── EnrollmentCard.tsx
│   │   ├── assessment/
│   │   │   ├── QuizPlayer.tsx
│   │   │   ├── AssignmentPortal.tsx
│   │   │   └── GradeDisplay.tsx
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── InstructorDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── Analytics.tsx
│   │   ├── payment/
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── PaymentStatus.tsx
│   │   │   └── InvoiceView.tsx
│   │   ├── forum/
│   │   │   ├── ForumList.tsx
│   │   │   ├── ThreadView.tsx
│   │   │   └── PostForm.tsx
│   │   ├── ai-tutor/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── InputBox.tsx
│   │   └── accessibility/
│   │       ├── AccessibilityFAB.tsx
│   │       ├── AccessibilityHelper.tsx
│   │       └── AccessibilitySettings.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── BrowseCourses.tsx
│   │   ├── CoursePage.tsx
│   │   ├── LessonViewer.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Payment.tsx
│   │   ├── Profile.tsx
│   │   ├── NotFound.tsx
│   │   └── Error.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCourse.ts
│   │   ├── usePayment.ts
│   │   ├── useFetch.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── courseService.ts
│   │   ├── paymentService.ts
│   │   ├── analyticsService.ts
│   │   └── storageService.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── errorHandler.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   ├── accessibility.css
│   │   └── animations.css
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── course.ts
│   │   ├── payment.ts
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── .env.example
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## 2. COMPONENT ARCHITECTURE

### 2.1 Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   ├── Sidebar
│   │   └── NavLinks
│   ├── Main Content
│   │   └── Routes
│   │       ├── Home
│   │       ├── BrowseCourses
│   │       ├── CoursePage
│   │       │   ├── CourseHeader
│   │       │   ├── LessonViewer
│   │       │   └── LessonList
│   │       ├── Dashboard
│   │       │   ├── StudentDashboard
│   │       │   ├── InstructorDashboard
│   │       │   └── AdminDashboard
│   │       ├── Payment
│   │       │   ├── PaymentForm
│   │       │   └── PaymentStatus
│   │       └── Profile
│   └── Footer
└── Modals
    ├── AuthModal
    ├── ConfirmModal
    └── NotificationModal
```

### 2.2 Smart Components vs Presentational Components

```
Smart Components (Containers)
├── Dashboard.tsx (manages state, fetches data)
├── CoursePage.tsx (handles enrollment logic)
├── PaymentPage.tsx (manages payment flow)
└── ForumPage.tsx (manages forum state)

Presentational Components (UI)
├── CourseCard.tsx (displays course info)
├── LessonList.tsx (displays lessons)
├── QuizPlayer.tsx (displays quiz UI)
├── Button.tsx (reusable button)
└── Card.tsx (reusable card)
```

---

## 3. STATE MANAGEMENT

### 3.1 Context API Structure

```typescript
// AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

// ThemeContext
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// NotificationContext
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}
```

### 3.2 Custom Hooks

```typescript
// useAuth Hook
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// useCourse Hook
function useCourse(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCourse();
  }, [courseId]);
  
  return { course, loading, error };
}

// useFetch Hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [url]);
  
  return { data, loading, error };
}
```

---

## 4. ROUTING STRUCTURE

### 4.1 Route Configuration

```typescript
// routes.ts
const routes = [
  {
    path: '/',
    element: <Home />,
    public: true
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    public: true,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> }
    ]
  },
  {
    path: '/courses',
    element: <ProtectedRoute><CoursesLayout /></ProtectedRoute>,
    children: [
      { path: '', element: <BrowseCourses /> },
      { path: ':courseId', element: <CoursePage /> },
      { path: ':courseId/lesson/:lessonId', element: <LessonViewer /> }
    ]
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
    children: [
      { path: 'student', element: <StudentDashboard /> },
      { path: 'instructor', element: <InstructorDashboard /> },
      { path: 'admin', element: <AdminDashboard /> }
    ]
  },
  {
    path: '/payment/:courseId',
    element: <ProtectedRoute><Payment /></ProtectedRoute>
  },
  {
    path: '/profile',
    element: <ProtectedRoute><Profile /></ProtectedRoute>
  },
  {
    path: '*',
    element: <NotFound />
  }
];
```

---

## 5. API SERVICE LAYER

### 5.1 API Client

```typescript
// api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

class APIClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  get<T>(url: string, config?: any): Promise<T> {
    return this.client.get(url, config);
  }
  
  post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post(url, data, config);
  }
  
  put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put(url, data, config);
  }
  
  delete<T>(url: string, config?: any): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const apiClient = new APIClient();
```

### 5.2 Service Classes

```typescript
// courseService.ts
class CourseService {
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    return apiClient.get('/courses', { params: filters });
  }
  
  async getCourse(id: string): Promise<Course> {
    return apiClient.get(`/courses/${id}`);
  }
  
  async getCourseWithAccess(id: string): Promise<CourseWithAccess> {
    return apiClient.get(`/smart-enrollment/courses/${id}/with-access`);
  }
  
  async createCourse(data: CreateCourseData): Promise<Course> {
    return apiClient.post('/courses', data);
  }
  
  async updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
    return apiClient.put(`/courses/${id}`, data);
  }
  
  async deleteCourse(id: string): Promise<void> {
    return apiClient.delete(`/courses/${id}`);
  }
}

export const courseService = new CourseService();
```

---

## 6. FORM HANDLING

### 6.1 Form Validation

```typescript
// validators.ts
export const validators = {
  email: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  password: (password: string): boolean => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  },
  
  courseTitle: (title: string): boolean => {
    return title.length >= 3 && title.length <= 100;
  }
};

// useForm Hook
function useForm<T>(initialValues: T, onSubmit: (values: T) => Promise<void>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      setErrors({ submit: 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit };
}
```

---

## 7. ERROR HANDLING

### 7.1 Error Boundary

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 7.2 Error Handling Utilities

```typescript
// errorHandler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

export const handleError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error.response) {
    return new AppError(
      error.response.status,
      error.response.data?.message || 'An error occurred',
      error.response.data
    );
  }
  
  return new AppError(500, 'An unexpected error occurred');
};
```

---

## 8. PERFORMANCE OPTIMIZATION

### 8.1 Code Splitting

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const BrowseCourses = lazy(() => import('./pages/BrowseCourses'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<BrowseCourses />} />
        <Route path="/courses/:id" element={<CoursePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### 8.2 Memoization

```typescript
// CourseCard.tsx
const CourseCard = memo(({ course, onEnroll }: CourseCardProps) => {
  return (
    <div className="course-card">
      <img src={course.thumbnail} alt={course.title} />
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <button onClick={() => onEnroll(course.id)}>Enroll</button>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.course.id === nextProps.course.id;
});
```

### 8.3 Image Optimization

```typescript
// OptimizedImage.tsx
function OptimizedImage({ src, alt, width, height }: ImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
```

---

## 9. ACCESSIBILITY FEATURES

### 9.1 ARIA Labels

```typescript
// AccessibleButton.tsx
function AccessibleButton({ label, onClick, disabled }: ButtonProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="btn"
    >
      {label}
    </button>
  );
}
```

### 9.2 Keyboard Navigation

```typescript
// AccessibleMenu.tsx
function AccessibleMenu({ items }: MenuProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
        items[focusedIndex].onClick();
        break;
    }
  };
  
  return (
    <ul role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={index}
          role="menuitem"
          tabIndex={focusedIndex === index ? 0 : -1}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

---

## 10. TESTING STRATEGY

### 10.1 Component Testing

```typescript
// CourseCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseCard from './CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    id: '1',
    title: 'Test Course',
    description: 'Test Description',
    price: 99
  };
  
  it('renders course information', () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });
  
  it('calls onEnroll when button is clicked', async () => {
    const onEnroll = jest.fn();
    render(<CourseCard course={mockCourse} onEnroll={onEnroll} />);
    
    const button = screen.getByRole('button', { name: /enroll/i });
    await userEvent.click(button);
    
    expect(onEnroll).toHaveBeenCalledWith('1');
  });
});
```

### 10.2 Hook Testing

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should login user', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

---

## 11. STYLING APPROACH

### 11.1 Tailwind CSS Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4361ee',
        secondary: '#3f37c9',
        accent: '#7209b7',
        success: '#4cc9f0',
        warning: '#f72585'
      },
      spacing: {
        '128': '32rem'
      }
    }
  },
  plugins: []
};
```

### 11.2 CSS Modules

```css
/* CourseCard.module.css */
.card {
  @apply bg-white dark:bg-dark-card rounded-lg shadow-md p-4;
}

.title {
  @apply text-lg font-bold text-gray-900 dark:text-white;
}

.description {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
}
```

---

## 12. ENVIRONMENT CONFIGURATION

### 12.1 Environment Variables

```bash
# .env.example
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SESA Academy
VITE_APP_VERSION=1.0.0
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_CLIENT_ID=...
VITE_ANALYTICS_ID=...
```

---

## 13. BUILD & DEPLOYMENT

### 13.1 Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

**END OF PART 3**
