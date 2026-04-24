import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    createSession, listSessions, getSession, startSession, joinSession, endSession,
    kickParticipant, getParticipants, adminMonitor, updateSession, approveParticipant,
    toggleRecording, forceStopSession, getSessionAnalytics, getAnalyticsDashboard,
} from '../controllers/liveStreamController.js';
import { streamAuthenticate, requireHostRole, requireAdminRole, requireCourseEnrollment, requireSessionOwner } from '../middleware/streamAuth.js';

const router = Router();

const tokenLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many join requests' }, standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === 'development' });
const createLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { success: false, message: 'Too many sessions created' }, standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === 'development' });

router.use(streamAuthenticate);

// Admin
router.get('/admin/monitor', requireAdminRole, adminMonitor);
router.post('/admin/force-stop/:id', requireAdminRole, forceStopSession);

// Analytics
router.get('/analytics/dashboard', requireHostRole, getAnalyticsDashboard);
router.get('/analytics/session/:id', requireHostRole, getSessionAnalytics);

// Session CRUD
router.post('/sessions', createLimiter, requireHostRole, createSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSession);
router.patch('/sessions/:id', requireHostRole, requireSessionOwner, updateSession);

// Session Lifecycle
router.post('/sessions/:id/start', requireHostRole, requireSessionOwner, startSession);
router.post('/sessions/:id/end', requireHostRole, requireSessionOwner, endSession);

// Participant Actions
router.post('/sessions/:id/join', tokenLimiter, requireCourseEnrollment, joinSession);
router.get('/sessions/:id/participants', requireHostRole, getParticipants);
router.post('/sessions/:id/kick', requireHostRole, requireSessionOwner, kickParticipant);
router.post('/sessions/:id/approve', requireHostRole, requireSessionOwner, approveParticipant);
router.post('/sessions/:id/recording/toggle', requireHostRole, requireSessionOwner, toggleRecording);

export default router;
