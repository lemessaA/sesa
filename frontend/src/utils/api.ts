import axios, { type InternalAxiosRequestConfig } from 'axios';

// API Configuration
// Ensure the base URL always has the /api prefix for consistency
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || '';
  
  // In development, if no env var, default to localhost:5000
  if (!envUrl && import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  // Ensure url ends with /api but not with //api
  let cleanUrl = envUrl.trim().replace(/\/+$/, '');
  
  if (!cleanUrl) {
    console.warn('[API] VITE_API_URL is not set. API calls may fail.');
    return '/api'; // Relative fallback
  }

  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

/** Deduplicate parallel 401s so we only call /auth/refresh once. */
let refreshInFlight: Promise<string | null> | null = null;

function setAuthHeaderForRetry(config: InternalAxiosRequestConfig, token: string) {
  const h = config.headers;
  if (h && typeof (h as { set?: (a: string, b: string) => void }).set === 'function') {
    (h as { set: (a: string, b: string) => void }).set('Authorization', `Bearer ${token}`);
  } else {
    (config as InternalAxiosRequestConfig & { headers: Record<string, string> }).headers = {
      ...(h as object as Record<string, string>),
      Authorization: `Bearer ${token}`,
    };
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }
  // Assign synchronously so concurrent 401s share one refresh, not N parallel POSTs.
  refreshInFlight = axios
    .post<{ token?: string }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
    )
    .then((res) => {
      const token = res.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        return token;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: refresh access token (15m) via httpOnly cookie, then retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | ({ _retry?: boolean; url?: string; headers?: Record<string, string> } & typeof error.config)
      | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const preUrl = originalRequest.url || '';
      const authNoRefresh = ['/auth/login', '/auth/register', '/auth/forgot-password'];
      const isAuthNoRefresh = authNoRefresh.some((ep) => preUrl.includes(ep));
      if (!isAuthNoRefresh && !preUrl.includes('/auth/refresh')) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          setAuthHeaderForRetry(originalRequest, newToken);
          return api(originalRequest);
        }
      }
    }

    if (error.response) {
      const requestUrl: string = error.config?.url || '';
      // List of auth endpoints that should NOT trigger a forced redirect on 401
      // (the login/register forms handle their own errors)
      const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];
      const isAuthEndpoint = authEndpoints.some((ep) => requestUrl.includes(ep));

      switch (error.response.status) {
        case 401:
          // Refresh failed or no cookie: force re-login. Wrong password on login: do not nuke session.
          if (requestUrl.includes('/auth/refresh')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('sesa:unauthorized'));
          } else if (!isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('sesa:unauthorized'));
          }
          break;
        case 403:
          console.error('Access denied:', error.response?.data?.message);
          break;
        case 404:
          console.error('Resource not found:', error.response?.data?.message);
          break;
        case 500:
          console.error('❌ [API] Server Error:', error.response?.data?.message || 'Internal Server Error');
          break;
        case 503:
          const dbMsg = error.response?.data?.message || 'Database connection error';
          console.error(`🛑 [API] Service Unavailable (503): ${dbMsg}`);
          console.error('Tip: Make sure MongoDB is running and access is allowed in your DB dashboard (Whitelist IP).');
          break;
        default:
          console.error(`⚠️ [API] Error (${error.response.status}):`, error.response?.data?.message || 'Unknown error');
      }
    } else if (error.request) {
      console.error('🔌 [API] Network Error: No response received. Is the backend server running?', error.message);
    } else {
      console.error('🧨 [API] Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) => 
      api.post('/auth/login', { email, password }),
    register: (data: any) => 
      api.post('/auth/register', data),
    logout: () => 
      api.post('/auth/logout'),
  },

  // Course endpoints
  courses: {
    getAll: (params?: any) => 
      api.get('/courses', { params }),
    getById: (id: string) => 
      api.get(`/courses/${id}`),
    create: (data: any) => 
      api.post('/courses', data),
    update: (id: string, data: any) => 
      api.put(`/courses/${id}`, data),
    delete: (id: string) => 
      api.delete(`/courses/${id}`),
    
    // Course management endpoints
    getFreePreview: (courseId: string) =>
      api.get(`/course-management/courses/${courseId}/free-preview`),
    getLesson: (courseId: string, lessonIndex: number) =>
      api.get(`/course-management/courses/${courseId}/lesson/${lessonIndex}`),
    getFullContent: (courseId: string) =>
      api.get(`/course-management/courses/${courseId}/full-content`),
  },

  // Enrollment endpoints
  enrollments: {
    requestAccess: (courseId: string, data: any) =>
      api.post(`/enrollments/request/${courseId}`, data),
    getMyEnrollments: () =>
      api.get('/courses/my/enrolled'),
  },

  // Teacher endpoints
  teacher: {
    getPendingCourses: () =>
      api.get('/course-management/teacher/courses/my-pending'),
    getPublishedCourses: () =>
      api.get('/course-management/teacher/courses/my-published'),
    getStats: () =>
      api.get('/course-management/teacher/courses/my-stats'),
  },

  // Admin endpoints
  admin: {
    // Course review
    getPendingReviewCourses: () =>
      api.get('/course-management/admin/courses/pending-review'),
    previewCourse: (courseId: string) =>
      api.get(`/course-management/admin/courses/${courseId}/preview`),
    reviewCourse: (courseId: string, decision: 'accept' | 'reject', adminComment?: string) =>
      api.put(`/course-management/admin/courses/${courseId}/review`, { decision, adminComment }),
    
    // Enrollment verification
    getEnrollmentsForVerification: () =>
      api.get('/course-management/admin/enrollments/verification'),
    verifyEnrollment: (enrollmentId: string, adminComment?: string) =>
      api.put(`/course-management/admin/enrollments/${enrollmentId}/verify`, { adminComment }),
    
    // Course management
    toggleCourseLock: (courseId: string, locked: boolean) =>
      api.patch(`/course-management/courses/${courseId}/toggle-lock`, { locked }),
    toggleCourseVisibility: (courseId: string, visible: boolean) =>
      api.patch(`/course-management/courses/${courseId}/toggle-visibility`, { visible }),
    
    // User management
    getAllUsers: () =>
      api.get('/users'),
  },

  // Announcement endpoints
  announcements: {
    getAll: () => 
      api.get('/announcements'),
    create: (data: any) => 
      api.post('/announcements', data),
    toggle: (id: string, isActive: boolean) =>
      api.put(`/announcements/${id}/toggle`, { isActive }),
  },

  // User endpoints
  users: {
    getProfile: () =>
      api.get('/users/profile'),
    updateProfile: (data: any) =>
      api.put('/users/profile', data),
    getDashboardData: () =>
      api.get('/users/dashboard-data'),
  },

  // Category endpoints
  categories: {
    getAll: () =>
      api.get('/categories'),
    getById: (id: string) =>
      api.get(`/categories/${id}`),
    create: (data: any) =>
      api.post('/categories', data),
    update: (id: string, data: any) =>
      api.put(`/categories/${id}`, data),
    delete: (id: string) =>
      api.delete(`/categories/${id}`),
  },

  // Payment endpoints
  payments: {
    create: (data: any) =>
      api.post('/payments', data),
    getHistory: () =>
      api.get('/payments/history'),
  },

  // Search endpoints
  search: {
    query: (q: string, filters?: any) => 
      api.get('/search', { params: { q, ...filters } }),
    getSuggestions: (q: string) => 
      api.get('/search/suggestions', { params: { q } }),
  },

  // Assessment & Gradebook endpoints
  assessments: {
    getStudentGradebook: (courseId: string) =>
      api.get(`/assessments/gradebook/${courseId}`),
    updateMark: (data: { studentId: string, courseId: string, assessmentType: string, score: number, feedback?: string }) =>
      api.post('/assessments/mark', data),
    getCourseGradebook: (courseId: string) =>
      api.get(`/assessments/gradebook/all/${courseId}`),
    submit: (data: any) =>
      api.post('/assessments/submit', data),
  },

  // Evaluation endpoints
  evaluations: {
    submit: (data: { courseId: string, instructorId: string, ratings: any, feedback? : string }) =>
      api.post('/evaluations', data),
    getInstructorEvaluations: (instructorId: string) =>
      api.get(`/evaluations/instructor/${instructorId}`),
  },

  // Forum endpoints
  forums: {
    getCourseThreads: (courseId: string) =>
      api.get(`/forums/course/${courseId}`),
    createThread: (data: { title: string; content: string; courseId: string }) =>
      api.post('/forums/threads', data),
    addPost: (threadId: string, data: { content: string }) =>
      api.post(`/forums/threads/${threadId}/posts`, data),
  },

  // Video workflow & lesson access endpoints
  videoWorkflow: {
    // Lessons visible to a student for a given course
    getAccessibleLessons: (courseId: string) =>
      api.get(`/video-workflow/courses/${courseId}/lessons`),

    // Start a payment to unlock a specific lesson
    processLessonPayment: (
      lessonId: string,
      data: { paymentMethod: 'stripe' | 'paypal' | 'manual'; amount: number },
    ) =>
      api.post(`/video-workflow/lessons/${lessonId}/payment`, data),

    // Teacher: upload a lesson video (multipart/form-data)
    uploadVideo: (formData: FormData) =>
      api.post('/video-workflow/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    // Admin / moderator: list pending videos for review
    getPendingVideos: (params?: { page?: number; limit?: number }) =>
      api.get('/video-workflow/videos/pending', { params }),

    // Admin / moderator: approve or reject a video
    reviewVideo: (
      videoId: string,
      data: { decision: 'approved' | 'rejected'; feedback?: string; notes?: string },
    ) =>
      api.put(`/video-workflow/videos/${videoId}/review`, data),

    // Student: upload a lesson screenshot (multipart/form-data)
    uploadScreenshot: (formData: FormData) =>
      api.post('/video-workflow/screenshots/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    // Admin / moderator: list screenshots awaiting review
    getScreenshotsForReview: (params?: {
      courseId?: string;
      lessonId?: string;
      page?: number;
      limit?: number;
    }) =>
      api.get('/video-workflow/screenshots/review', { params }),

    // Admin / moderator: review a specific screenshot
    reviewScreenshot: (
      screenshotId: string,
      data: { approved: boolean; feedback?: string; flagged?: boolean; flagReason?: string },
    ) =>
      api.put(`/video-workflow/screenshots/${screenshotId}/review`, data),

    // Public: serve uploaded video/screenshot by type and filename
    getUploadUrl: (type: 'videos' | 'screenshots', filename: string) =>
      `${API_BASE_URL.replace(/\/api$/, '')}/api/video-workflow/uploads/${type}/${filename}`,
  },

  // AI / assistant endpoints
  ai: {
    chat: (message: string, context?: string) =>
      api.post('/ai/chat', { message, context }),
    generateLesson: (topic: string, level?: string, language?: string) =>
      api.post('/ai/generate-lesson', { topic, level, language }),
    summarize: (text: string, maxSentences?: number) =>
      api.post('/ai/summarize', { text, maxSentences }),
  },

  /**
   * Personal agent (v1 REST): POST /api/v1/agent/messages
   * Legacy /api/ai-agent/chat still works; prefer this path. Response: { data: { reply, intent, ... } }.
   */
  aiAgent: {
    chat: (message: string, conversationHistory?: { role: string; content: string }[]) =>
      api.post(
        '/v1/agent/messages',
        { message, conversationHistory },
        { timeout: 120000 }
      ),
  },

  // AI tutor endpoints
  aiTutor: {
    startSession: (data: { courseId: string; learningStyle: string; difficultyLevel: string }) =>
      api.post('/ai-tutor/session/start', data),
    chat: (data: { sessionId: string; message: string; includeVisuals?: boolean }) =>
      api.post('/ai-tutor/session/chat', data),
    generateQuiz: (data: { sessionId: string; questionCount?: number; difficulty?: string }) =>
      api.post('/ai-tutor/session/generate-quiz', data),
    studyPlan: (data: { courseId: string; timeAvailable: number; goals: string }) =>
      api.post('/ai-tutor/study-plan', data),
    endSession: (data: { sessionId: string }) =>
      api.post('/ai-tutor/session/end', data),
  },

  // Collaboration endpoints
  collaboration: {
    joinRoom: (roomId: string) =>
      api.post(`/collaboration/rooms/${roomId}/join`),
    leaveRoom: (roomId: string) =>
      api.post(`/collaboration/rooms/${roomId}/leave`),
    sendMessage: (roomId: string, data: { message: string; type: string }) =>
      api.post(`/collaboration/rooms/${roomId}/messages`, data),
    updateWhiteboard: (roomId: string, data: { elements: any[] }) =>
      api.put(`/collaboration/rooms/${roomId}/whiteboard`, data),
  },

  // Advanced analytics endpoints
  advancedAnalytics: {
    getLearningPatterns: (courseId?: string) =>
      api.get('/advanced-analytics/learning-patterns', { params: courseId ? { courseId } : undefined }),
    getCourseInsights: (courseId: string) =>
      api.get(`/advanced-analytics/course-insights/${courseId}`),
    getRealtime: () =>
      api.get('/advanced-analytics/realtime'),
    getPredictions: (type = 'engagement') =>
      api.get('/advanced-analytics/predictions', { params: { type } }),
  },

  // Certificate endpoints
  certificates: {
    getMyCertificates: () =>
      api.get('/certificates/my-certificates'),
  },

  // Utility function to check API health
  healthCheck: () => api.get('/health'),

  /** GET /api/v1 — v1 index + HATEOAS links (no auth) */
  apiV1: () => api.get('/v1'),
};

export const apiClient = api;
export default apiService;