# 🤖 AI PROMPTS FOR SESA ACADEMY

## WHAT'S INCLUDED

This package contains detailed AI prompts for developing SESA Academy with Lovable (frontend) and Cursor (backend).

### Files

1. **AI_PROMPT_FRONTEND_LOVABLE.md** (Lovable/Claude)
   - Complete frontend development guide
   - Component architecture and patterns
   - Design system and styling
   - API integration patterns
   - Accessibility requirements
   - ~2000 lines of detailed guidance

2. **AI_PROMPT_BACKEND_CURSOR.md** (Cursor/Claude)
   - Complete backend development guide
   - API endpoint specifications
   - Database models and schemas
   - Service and repository patterns
   - Security and performance guidelines
   - ~1500 lines of detailed guidance

3. **AI_PROMPTS_INTEGRATION_GUIDE.md**
   - How to use the prompts
   - Workflow integration
   - Testing strategy
   - Debugging tips
   - Deployment checklist
   - Common issues and solutions

4. **AI_PROMPTS_README.md** (This file)
   - Quick reference and setup

---

## QUICK START

### For Frontend Development (Lovable)

1. Open `AI_PROMPT_FRONTEND_LOVABLE.md`
2. Copy all content
3. Go to Lovable → Settings → System Prompt
4. Paste the content
5. Start asking Lovable to build components

**Example Prompt:**
```
"Implement the CoursePage component that displays a course with lessons. 
Use the smart enrollment API endpoints to fetch course data with access info. 
Show lock icons on paid lessons and an unlock button with the price."
```

### For Backend Development (Cursor)

1. Open `AI_PROMPT_BACKEND_CURSOR.md`
2. Copy all content
3. In Cursor, create/edit `.cursor/rules`
4. Paste the content
5. Start asking Cursor to implement endpoints

**Example Prompt:**
```
"Implement the smart enrollment endpoints. 
Create the controller methods for getting user enrollments, 
checking course access, and fetching courses with access info."
```

---

## KEY FEATURES COVERED

### Smart Enrollment System
- Free/paid course access
- Payment processing
- Access control middleware
- Enrollment tracking

### AI Tutor
- Personalized learning sessions
- Context-aware responses
- Quiz generation
- Study plan creation

### Real-Time Collaboration
- Virtual study rooms
- Interactive whiteboard
- Live chat
- Participant tracking

### Advanced Analytics
- Learning pattern analysis
- Predictive insights
- Risk assessment
- Real-time metrics

### Accessibility
- Voice navigation
- Screen reader support
- High contrast modes
- Dynamic font sizing

---

## TECH STACK REFERENCE

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Context API
- React Router
- Axios

**Backend:**
- Node.js + Express + TypeScript
- MongoDB
- Redis
- JWT
- Socket.io
- Google Gemini AI

---

## IMPORTANT NOTES

⚠️ **DO NOT COMMIT THESE PROMPTS TO GITHUB**

These are for local AI development only. They contain:
- Detailed implementation guidance
- API specifications
- Database schemas
- Security patterns
- Performance optimization tips

Add to `.gitignore`:
```
AI_PROMPT_*.md
AI_PROMPTS_*.md
```

---

## USAGE TIPS

### 1. Use One Feature at a Time
Ask the AI to implement one component or endpoint at a time for better results.

### 2. Reference the Prompts
When asking for help, reference specific sections from the prompts.

### 3. Provide Context
Include relevant data structures and API endpoints in your requests.

### 4. Test as You Go
Test each component/endpoint before moving to the next.

### 5. Follow Patterns
Use the patterns defined in the prompts for consistency.

---

## DEVELOPMENT PHASES

### Phase 1: Backend Setup ✅ DONE
- Database models
- Middleware
- Smart enrollment endpoints
- Payment endpoint

### Phase 2: Frontend Components ⏳ READY
- CoursePage
- LessonViewer
- EnrollmentCard
- PaymentPage
- AITutor
- StudyRoom
- AdvancedAnalytics

### Phase 3: Integration Testing ⏳ PENDING
- API testing
- Component testing
- E2E testing
- Accessibility testing

### Phase 4: Deployment ⏳ PENDING
- Backend deployment
- Frontend deployment
- Database migration
- Monitoring setup

---

## COMMON PROMPTS

### Frontend

```
"Create a component that displays a list of courses with enrollment status"

"Implement a payment form that handles Stripe payments"

"Build an AI chat interface with message history and voice input"

"Add accessibility features: voice navigation and high contrast mode"

"Create a dashboard showing learning analytics and predictions"
```

### Backend

```
"Implement an endpoint to get user course enrollments"

"Create a payment processing endpoint with Stripe integration"

"Build an AI tutor session manager with Google Gemini API"

"Implement real-time collaboration endpoints with Socket.io"

"Create analytics endpoints for learning pattern analysis"
```

---

## TROUBLESHOOTING

### Issue: AI doesn't understand the context
**Solution:** Copy the entire prompt into the AI system, not just snippets

### Issue: Generated code doesn't match the style
**Solution:** Reference the coding standards section in the prompt

### Issue: API integration not working
**Solution:** Check the API endpoint specifications in the prompt

### Issue: TypeScript errors
**Solution:** Reference the type definitions in the prompt

---

## RESOURCES

- **Frontend Architecture:** SESA_FRONTEND_ARCHITECTURE.md
- **Backend Architecture:** SESA_BACKEND_ARCH.md
- **Project Specification:** SESA_PROJECT_SPEC_PART1.md
- **Quick Reference:** QUICK_REFERENCE.md
- **Deployment Guide:** DEPLOYMENT_GUIDE.md

---

## NEXT STEPS

1. ✅ Review this README
2. ✅ Copy frontend prompt to Lovable
3. ✅ Copy backend prompt to Cursor
4. ⏳ Start implementing Phase 2 (Frontend)
5. ⏳ Run integration tests
6. ⏳ Deploy to production

---

## SUPPORT

For questions or issues:

1. Check the relevant prompt file
2. Review the integration guide
3. Check the project documentation
4. Test with the provided examples

---

**Created:** April 12, 2026
**Status:** Production Ready
**Version:** 1.0.0

**Remember:** These prompts are your AI development companions. Use them to maintain consistency, quality, and best practices throughout the project.
