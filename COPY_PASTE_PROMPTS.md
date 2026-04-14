# 📋 COPY-PASTE AI PROMPTS FOR LOVABLE & CURSOR

Use these ready-to-use prompts with Lovable and Cursor. Just copy and paste them directly.

---

## 🎨 LOVABLE FRONTEND PROMPTS

### 1. Smart Enrollment - Course Page

```
I need to build a CoursePage component for SESA Academy. Here's what it should do:

1. Fetch course data with access info using: GET /api/smart-enrollment/courses/:courseId/with-access
2. Display course title, description, instructor, and price
3. Show a list of lessons with:
   - Lesson title and order
   - Lock icon for paid lessons (isFree: false)
   - Play icon for free lessons (isFree: true)
   - "Unlock" button with price for locked lessons
4. When user clicks a lesson:
   - If accessible: navigate to lesson viewer
   - If locked: show unlock button
5. Handle loading and error states
6. Use TypeScript with proper types
7. Style with Tailwind CSS using the design system colors

The component should be responsive and accessible.
```

### 2. Smart Enrollment - Lesson Viewer

```
Build a LessonViewer component that:

1. Fetches lesson data from: GET /api/smart-enrollment/courses/:courseId/lessons/:lessonId
2. Displays a video player with the lesson video
3. Shows lesson title, description, and resources
4. Has navigation buttons to go to previous/next lesson
5. Shows a progress bar for the course
6. Displays lesson resources (PDFs, links, code)
7. Handles access denied (403) by showing a lock screen
8. Uses TypeScript and Tailwind CSS
9. Is fully responsive and accessible

Include error handling and loading states.
```

### 3. Smart Enrollment - Payment Page

```
Create a PaymentPage component that:

1. Shows the course details (title, price, instructor)
2. Has a payment form with:
   - Amount (pre-filled from course price)
   - Payment method selector (Stripe, PayPal, Manual)
   - Card details input (for Stripe)
   - Submit button
3. Calls POST /api/payments/course/:courseId on submit
4. Shows loading state during payment
5. On success: shows confirmation and redirects to course
6. On error: shows error message
7. Uses TypeScript and Tailwind CSS
8. Is fully accessible

Include proper error handling and validation.
```

### 4. AI Tutor - Chat Interface

```
Build an AITutor component with:

1. A chat interface that:
   - Displays messages in bubbles (user on right, AI on left)
   - Shows timestamps for each message
   - Has a loading indicator while AI responds
2. Message input box with:
   - Text input field
   - Send button
   - Voice input button (optional)
3. Settings panel with:
   - Learning style selector (visual, auditory, kinesthetic, reading)
   - Difficulty level selector (beginner, intermediate, advanced)
4. API integration:
   - POST /api/ai-tutor/session/start to start session
   - POST /api/ai-tutor/session/chat to send messages
   - POST /api/ai-tutor/session/end to end session
5. Session management:
   - Display session summary on end
   - Show option to generate quiz
6. Use TypeScript and Tailwind CSS
7. Full accessibility support

Include error handling and loading states.
```

### 5. Accessibility - Voice Navigation

```
Implement AccessibilityFAB component with:

1. A floating action button (FAB) in bottom-right corner
2. When clicked, shows accessibility menu with:
   - Voice navigation toggle
   - High contrast mode toggle
   - Font size adjuster (small, medium, large)
   - Text-to-speech toggle
   - Screen reader help
3. Voice commands support:
   - "Navigate to dashboard"
   - "Navigate to courses"
   - "Navigate to profile"
   - "Read page"
   - "Increase font size"
   - "Decrease font size"
   - "Enable high contrast"
4. Use Web Speech API for voice recognition
5. Persist settings to localStorage
6. Use TypeScript and Tailwind CSS
7. Fully accessible with keyboard navigation

Include error handling for browser compatibility.
```

### 6. Analytics - Dashboard

```
Create AdvancedAnalytics component that:

1. Fetches data from:
   - GET /api/advanced-analytics/learning-patterns
   - GET /api/advanced-analytics/predictions
   - GET /api/advanced-analytics/realtime
2. Displays charts using Recharts:
   - Learning pattern line chart
   - Completion rate bar chart
   - Risk level pie chart
3. Shows metrics cards:
   - Average session duration
   - Completion rate percentage
   - Engagement score
   - Risk level (color-coded)
4. Displays recommendations:
   - AI-generated improvement suggestions
   - Personalized learning tips
5. Real-time metrics:
   - Active users count
   - Courses in progress
   - Quizzes completed today
6. Use TypeScript and Tailwind CSS
7. Responsive grid layout
8. Full accessibility

Include loading states and error handling.
```

### 7. Collaboration - Study Room

```
Build StudyRoom component with:

1. Split-screen layout:
   - Left: Interactive whiteboard
   - Right: Chat panel
2. Whiteboard features:
   - Drawing tools (pen, eraser, shapes)
   - Color picker
   - Clear/undo/redo buttons
   - Save drawing option
3. Chat panel:
   - Message list with timestamps
   - Message input box
   - Participant list
4. Room controls:
   - Leave room button
   - Settings button
   - Share room link
5. API integration:
   - POST /api/collaboration/rooms to create
   - PUT /api/collaboration/rooms/:id/whiteboard to update
   - POST /api/collaboration/rooms/:id/messages to send messages
6. Socket.io for real-time updates
7. Use TypeScript and Tailwind CSS
8. Responsive design

Include error handling and loading states.
```

---

## ⚙️ CURSOR BACKEND PROMPTS

### 1. Smart Enrollment - Get User Enrollments

```
Implement the getUserCourseEnrollments endpoint:

1. Route: GET /api/smart-enrollment/my-enrollments
2. Middleware: authenticate
3. Logic:
   - Get userId from req.user
   - Find user and populate courseEnrollments
   - For each enrollment, get course title and price
   - Return enrollments with course details
4. Response format:
   {
     success: true,
     enrollments: [
       {
         courseId: string,
         enrollmentDate: Date,
         status: 'active' | 'expired' | 'cancelled',
         accessLevel: 'free' | 'paid',
         approvalStatus: 'pending' | 'approved' | 'rejected',
         courseTitle: string,
         coursePrice: number
       }
     ]
   }
5. Error handling:
   - 401 if not authenticated
   - 404 if user not found
6. Use TypeScript with proper types
7. Add logging for debugging

Include proper error handling and validation.
```

### 2. Smart Enrollment - Check Course Access

```
Implement the checkCourseAccessLevel endpoint:

1. Route: GET /api/smart-enrollment/courses/:courseId/access-check
2. Middleware: optional authenticate (works for both logged-in and guest users)
3. Logic:
   - Get courseId from params
   - Find course and count free lessons
   - If user authenticated:
     - Check if user has enrollment with accessLevel='paid'
     - If yes, set hasAccess=true, accessLevel='paid'
     - If no, set hasAccess=false, accessLevel='free' (can access free lessons)
   - If user not authenticated:
     - Set hasAccess=false, accessLevel='none'
4. Response format:
   {
     courseId: string,
     hasAccess: boolean,
     accessLevel: 'free' | 'paid' | 'none',
     lessonsAccessible: number,
     totalLessons: number,
     canUnlock: boolean,
     price: number
   }
5. Error handling:
   - 404 if course not found
6. Use TypeScript with proper types

Include proper error handling and validation.
```

### 3. Smart Enrollment - Get Course with Access

```
Implement the getCourseWithAccess endpoint:

1. Route: GET /api/smart-enrollment/courses/:courseId/with-access
2. Middleware: optional authenticate
3. Logic:
   - Get courseId from params
   - Find course with lessons
   - For each lesson:
     - If isFree=true: set isAccessible=true
     - If isFree=false and user has paid access: set isAccessible=true
     - Otherwise: set isAccessible=false
   - Return course with access info
4. Response format:
   {
     course: {
       _id: string,
       title: string,
       description: string,
       price: number,
       instructor: { name: string },
       lessons: [
         {
           _id: string,
           title: string,
           order: number,
           isFree: boolean,
           isAccessible: boolean,
           description: string
         }
       ]
     },
     userAccess: {
       hasPaidAccess: boolean,
       accessLevel: 'free' | 'paid' | 'none'
     }
   }
5. Error handling:
   - 404 if course not found
6. Use TypeScript with proper types

Include proper error handling and validation.
```

### 4. Payment - Process Course Payment

```
Implement the processPayment endpoint:

1. Route: POST /api/payments/course/:courseId
2. Middleware: authenticate
3. Request body:
   {
     amount: number,
     paymentMethod: 'stripe' | 'paypal' | 'manual',
     transactionId?: string
   }
4. Logic:
   - Validate course exists
   - Validate amount matches course price
   - Check for duplicate payments (same user, course, within 24 hours)
   - Create Payment record with status='pending'
   - Process payment based on method:
     - Stripe: verify with Stripe API
     - PayPal: verify with PayPal API
     - Manual: mark as pending for admin approval
   - If payment successful:
     - Update Payment status to 'completed'
     - Add to User.courseEnrollments with accessLevel='paid'
     - Send confirmation email
   - Return transaction details
5. Response format:
   {
     success: true,
     transactionId: string,
     status: 'completed' | 'pending',
     message: 'Payment processed successfully'
   }
6. Error handling:
   - 401 if not authenticated
   - 404 if course not found
   - 400 if invalid amount
   - 409 if duplicate payment
7. Use TypeScript with proper types
8. Add logging for all payment attempts

Include proper error handling, validation, and security.
```

### 5. AI Tutor - Start Session

```
Implement the startTutorSession endpoint:

1. Route: POST /api/ai-tutor/session/start
2. Middleware: authenticate
3. Request body:
   {
     courseId: string,
     learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading',
     difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
   }
4. Logic:
   - Validate course exists
   - Get user profile and progress data
   - Create learning session with:
     - userId, courseId, learningStyle, difficultyLevel
     - Empty messages array
     - Struggling areas and strengths from progress
   - Generate personalized welcome message using Google Gemini API
   - Store session in Redis (or in-memory)
   - Return session ID and welcome message
5. Response format:
   {
     sessionId: string,
     welcomeMessage: string,
     learningStyle: string,
     difficultyLevel: string
   }
6. Error handling:
   - 401 if not authenticated
   - 404 if course not found
   - 503 if AI service unavailable
7. Use TypeScript with proper types
8. Add logging

Include proper error handling and validation.
```

### 6. AI Tutor - Chat with Tutor

```
Implement the chatWithTutor endpoint:

1. Route: POST /api/ai-tutor/session/chat
2. Middleware: authenticate
3. Request body:
   {
     sessionId: string,
     message: string
   }
4. Logic:
   - Validate session exists and belongs to user
   - Add user message to session
   - Generate AI response using Google Gemini API with context:
     - Course content
     - Learning style
     - Difficulty level
     - Previous messages
     - Struggling areas
   - Add AI response to session
   - Update session in Redis
   - Return AI response
5. Response format:
   {
     success: true,
     response: string,
     sessionId: string
   }
6. Error handling:
   - 401 if not authenticated
   - 404 if session not found
   - 503 if AI service unavailable
7. Use TypeScript with proper types
8. Add logging

Include proper error handling and validation.
```

### 7. Analytics - Learning Patterns

```
Implement the getLearningPatterns endpoint:

1. Route: GET /api/advanced-analytics/learning-patterns
2. Middleware: authenticate
3. Logic:
   - Get userId from req.user
   - Fetch user's progress data
   - Calculate metrics:
     - Average session duration
     - Completion rate
     - Quiz performance
     - Engagement score
     - Learning velocity
   - Analyze patterns:
     - Peak learning times
     - Preferred learning styles
     - Common struggling areas
   - Return analysis
4. Response format:
   {
     userId: string,
     patterns: {
       averageSessionDuration: number,
       completionRate: number,
       quizPerformance: number,
       engagementScore: number,
       learningVelocity: number,
       peakLearningTimes: string[],
       preferredLearningStyle: string,
       strugglingAreas: string[],
       strengths: string[]
     }
   }
5. Error handling:
   - 401 if not authenticated
   - 404 if user not found
6. Use TypeScript with proper types
7. Add logging

Include proper error handling and validation.
```

### 8. Analytics - Predictions

```
Implement the getPredictions endpoint:

1. Route: GET /api/advanced-analytics/predictions
2. Middleware: authenticate
3. Query params:
   - courseId (optional): specific course or all courses
4. Logic:
   - Get userId from req.user
   - For each course:
     - Calculate completion probability (0-100%)
     - Estimate completion date
     - Determine risk level (low, medium, high)
     - Generate recommendations
   - Use ML algorithms or heuristics:
     - Based on current progress
     - Based on learning patterns
     - Based on engagement metrics
   - Return predictions
5. Response format:
   {
     predictions: [
       {
         courseId: string,
         courseTitle: string,
         completionProbability: number,
         estimatedCompletionDate: Date,
         riskLevel: 'low' | 'medium' | 'high',
         recommendations: string[]
       }
     ]
   }
6. Error handling:
   - 401 if not authenticated
   - 404 if user not found
7. Use TypeScript with proper types
8. Add logging

Include proper error handling and validation.
```

---

## 🔄 INTEGRATION PROMPTS

### Testing Smart Enrollment Flow

```
Test the complete smart enrollment flow:

1. Create a test user
2. Get user enrollments (should be empty)
3. Check access to a paid course (should be 'none')
4. Process payment for the course
5. Check access again (should be 'paid')
6. Get course with access (should show all lessons as accessible)
7. Get specific lesson (should return lesson data)
8. Verify user enrollments (should include the course)

Use Postman or similar tool. Include:
- Request/response examples
- Error cases
- Edge cases
```

### Testing AI Tutor Flow

```
Test the complete AI tutor flow:

1. Start a tutoring session with learning style and difficulty
2. Send a message to the tutor
3. Verify AI response is contextual
4. Send follow-up messages
5. Generate a quiz from the conversation
6. End the session and get summary

Use Postman or similar tool. Include:
- Request/response examples
- Verify AI responses are appropriate
- Check session management
```

---

## 📝 NOTES

- Copy the entire prompt (including the numbered steps)
- Paste into Lovable or Cursor
- The AI will understand the context and generate appropriate code
- Adjust prompts as needed for your specific requirements
- Test each component/endpoint after implementation

---

**Last Updated:** April 12, 2026
**Status:** Ready to Use
**Version:** 1.0.0
