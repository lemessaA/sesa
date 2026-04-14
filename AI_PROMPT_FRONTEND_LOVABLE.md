# 🎨 SESA ACADEMY - FRONTEND AI PROMPT FOR LOVABLE

## PROJECT CONTEXT

You are building the **SESA Academy** - a revolutionary AI-powered educational platform. This is a React 18 + TypeScript + Tailwind CSS application with cutting-edge features including smart enrollment, AI tutoring, real-time collaboration, advanced analytics, and universal accessibility.

---

## TECH STACK

- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS with custom design system
- **Build Tool:** Vite
- **State Management:** Context API (AuthContext, ThemeContext, NotificationContext)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **API Base:** `VITE_API_URL` environment variable

---

## PROJECT STRUCTURE

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── course/          # Course-related components
│   │   ├── payment/         # Payment components
│   │   ├── ai-tutor/        # AI tutor interface
│   │   ├── collaboration/   # Study room components
│   │   ├── analytics/       # Analytics dashboard
│   │   └── accessibility/   # Accessibility features
│   ├── pages/               # Page components
│   ├── context/             # Context providers
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
├── .env                     # Environment variables
└── vite.config.ts
```

---

## CORE FEATURES TO IMPLEMENT

### 1. SMART ENROLLMENT SYSTEM

**Purpose:** Allow users to access free lessons and purchase paid courses

**Key Components:**
- `CoursePage.tsx` - Main course display with lesson list
- `LessonViewer.tsx` - Video player with lesson content
- `EnrollmentCard.tsx` - Shows enrollment status and progress
- `PaymentPage.tsx` - Payment processing interface
- `LockedLessonCard.tsx` - Displays locked lessons with unlock button

**API Endpoints to Use:**
```
GET  /api/smart-enrollment/my-enrollments
GET  /api/smart-enrollment/courses/:courseId/access-check
GET  /api/smart-enrollment/courses/:courseId/with-access
GET  /api/smart-enrollment/courses/:courseId/lessons
GET  /api/smart-enrollment/courses/:courseId/lessons/:lessonId
POST /api/payments/course/:courseId
```

**Data Structure:**
```typescript
interface Enrollment {
  courseId: string;
  enrollmentDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  accessLevel: 'free' | 'paid';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  expiresAt?: Date;
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  price: number;
  lessons: Lesson[];
  userAccess: {
    hasPaidAccess: boolean;
    accessLevel: 'free' | 'paid' | 'none';
  };
}
```

**Implementation Details:**
- Free lessons have `isFree: true` flag
- Paid lessons require enrollment with `accessLevel: 'paid'`
- Show lock icon on inaccessible lessons
- Display "Unlock" button with price
- Redirect to payment page on unlock click
- Update UI after successful payment

---

### 2. AI TUTOR INTERFACE

**Purpose:** Interactive chat with AI tutor for personalized learning

**Key Components:**
- `AITutor.tsx` - Main chat interface
- `ChatMessage.tsx` - Individual message display
- `InputBox.tsx` - Message input with voice support
- `TutorSettings.tsx` - Learning style and difficulty settings

**API Endpoints to Use:**
```
POST /api/ai-tutor/session/start
POST /api/ai-tutor/session/chat
POST /api/ai-tutor/quiz/generate
POST /api/ai-tutor/study-plan
POST /api/ai-tutor/session/end
```

**Features:**
- Start tutoring session with learning style selection
- Real-time chat with AI responses
- Voice input/output support
- Generate quiz from conversation
- Create personalized study plans
- Display session summary on end
- Adaptive difficulty based on responses

**UI/UX Requirements:**
- Clean, modern chat interface
- Message bubbles with timestamps
- Loading indicators for AI responses
- Settings panel for learning preferences
- Voice command button
- Session history sidebar

---

### 3. REAL-TIME COLLABORATION (STUDY ROOMS)

**Purpose:** Enable students to collaborate in virtual study rooms

**Key Components:**
- `StudyRoom.tsx` - Main collaboration interface
- `Whiteboard.tsx` - Interactive drawing canvas
- `ChatPanel.tsx` - Room chat system
- `ParticipantsList.tsx` - Active participants
- `RoomControls.tsx` - Room settings and controls

**API Endpoints to Use:**
```
POST /api/collaboration/rooms
PUT  /api/collaboration/rooms/:id/whiteboard
POST /api/collaboration/rooms/:id/messages
GET  /api/collaboration/rooms/:id
```

**Features:**
- Create and join study rooms
- Real-time whiteboard with drawing tools
- Live chat with room participants
- Participant list with status
- Screen sharing ready (WebRTC prepared)
- Room analytics and engagement tracking

**UI/UX Requirements:**
- Split-screen layout (whiteboard + chat)
- Drawing tools toolbar (pen, eraser, shapes)
- Color picker for drawing
- Clear/undo/redo buttons
- Participant avatars
- Message notifications

---

### 4. ADVANCED ANALYTICS DASHBOARD

**Purpose:** Display ML-powered learning insights and predictions

**Key Components:**
- `AdvancedAnalytics.tsx` - Main dashboard
- `LearningPatterns.tsx` - Pattern visualization
- `PredictiveInsights.tsx` - Forecast charts
- `RealTimeMetrics.tsx` - Live platform stats
- `RecommendationPanel.tsx` - AI suggestions

**API Endpoints to Use:**
```
GET /api/advanced-analytics/learning-patterns
GET /api/advanced-analytics/predictions
GET /api/advanced-analytics/realtime
```

**Features:**
- Learning pattern analysis with charts
- Predictive completion rates
- Risk assessment for at-risk students
- Real-time platform metrics
- Personalized recommendations
- Engagement forecasting

**UI/UX Requirements:**
- Interactive charts (Chart.js or Recharts)
- Color-coded risk levels
- Trend indicators
- Comparison views
- Export functionality
- Responsive grid layout

---

### 5. ACCESSIBILITY FEATURES

**Purpose:** Ensure universal access for all users

**Key Components:**
- `AccessibilityFAB.tsx` - Floating action button
- `AccessibilityHelper.tsx` - Settings panel
- `VoiceNavigation.tsx` - Voice command handler

**Features:**
- Voice navigation commands
- Screen reader optimization
- High contrast mode toggle
- Dynamic font sizing
- Text-to-speech engine
- Keyboard navigation
- Simplified interface option

**Voice Commands:**
```
"Navigate to dashboard/courses/profile"
"Read page/headings/selected text"
"Increase/decrease font size"
"Enable high contrast"
"Stop speaking"
```

**Implementation:**
- Use Web Speech API for voice recognition
- Implement ARIA labels on all interactive elements
- Ensure keyboard tab order is logical
- Test with screen readers (NVDA, JAWS)
- Maintain 4.5:1 contrast ratio
- Support keyboard shortcuts

---

## DESIGN SYSTEM

### Colors
```
Primary: #6366F1 (Indigo)
Secondary: #EC4899 (Pink)
Accent: #F59E0B (Amber)
Success: #10B981 (Green)
Error: #EF4444 (Red)
Warning: #F59E0B (Amber)
Dark: #1F2937 (Gray-900)
```

### Typography
```
Headings: Inter, Bold
Body: Inter, Regular
Code: Fira Code, Regular
```

### Spacing
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### Shadows
```
sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
premium: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

---

## CODING STANDARDS

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Use enums for constants
- Avoid `any` type
- Use discriminated unions for complex types

### React
- Use functional components with hooks
- Implement error boundaries
- Use React.memo for performance optimization
- Lazy load routes with React.lazy
- Use custom hooks for logic reuse

### Styling
- Use Tailwind CSS utility classes
- Create custom components for complex UI
- Use CSS modules for component-specific styles
- Maintain consistent spacing and sizing
- Use dark mode support

### File Organization
- One component per file
- Group related components in folders
- Keep hooks in separate files
- Organize services by domain
- Use index.ts for barrel exports

---

## AUTHENTICATION & STATE MANAGEMENT

### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}
```

### ThemeContext
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontSize: 'sm' | 'md' | 'lg';
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}
```

---

## API SERVICE PATTERN

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## CUSTOM HOOKS

### useAuth
```typescript
const { user, token, isAuthenticated, login, logout } = useAuth();
```

### useCourse
```typescript
const { course, loading, error, fetchCourse } = useCourse(courseId);
```

### useFetch
```typescript
const { data, loading, error } = useFetch<T>(url, dependencies);
```

### useForm
```typescript
const { values, errors, touched, handleChange, handleSubmit } = useForm(initialValues, onSubmit);
```

---

## PERFORMANCE OPTIMIZATION

- Code splitting with React.lazy
- Image optimization with lazy loading
- Memoization of expensive components
- Debouncing for search/filter inputs
- Pagination for large lists
- Virtual scrolling for long lists
- Service worker for offline support
- Caching strategies for API responses

---

## TESTING REQUIREMENTS

- Unit tests for components (Jest + React Testing Library)
- Integration tests for user flows
- E2E tests for critical paths (Cypress)
- Accessibility testing (axe-core)
- Performance testing (Lighthouse)
- Visual regression testing

---

## DEPLOYMENT

- Build: `npm run build`
- Preview: `npm run preview`
- Deploy to Vercel with automatic deployments on push
- Environment variables in `.env` file
- CDN for static assets
- Cloudflare for DDoS protection

---

## COMMON PATTERNS

### Loading State
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

### Form Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);
    await api.post('/endpoint', formData);
    showNotification('Success!', 'success');
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    setLoading(false);
  }
};
```

### Protected Route
```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

---

## ENVIRONMENT VARIABLES

```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_key_here
VITE_STRIPE_PUBLIC_KEY=your_key_here
VITE_APP_NAME=SESA Academy
```

---

## IMPORTANT NOTES

1. **Always check authentication** before making API calls
2. **Handle errors gracefully** with user-friendly messages
3. **Maintain responsive design** for all screen sizes
4. **Test accessibility** with keyboard and screen readers
5. **Optimize images** before using in components
6. **Use TypeScript strictly** - no implicit any
7. **Follow naming conventions** - PascalCase for components, camelCase for functions
8. **Document complex logic** with comments
9. **Keep components small** and focused
10. **Reuse components** from the common folder

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
npm run preview
```

**Run Tests:**
```bash
npm run test
npm run test:e2e
```

**Lint & Format:**
```bash
npm run lint
npm run format
```

---

## SUPPORT & RESOURCES

- **Documentation:** See SESA_FRONTEND_ARCHITECTURE.md
- **API Docs:** See SESA_BACKEND_ARCH.md
- **Design System:** See Tailwind config in tailwind.config.js
- **Type Definitions:** See src/types/index.ts
- **Examples:** Check existing components in src/components/

---

**Last Updated:** April 12, 2026
**Status:** Production Ready
**Version:** 1.0.0
