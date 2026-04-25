import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import LiveSession from '../models/LiveSession.js';
import User from '../../models/User.js';
import logger from '../../utils/logger.js';

export interface StreamAuthRequest extends Request {
    user?: { id: string; role: string; name?: string; email?: string };
    liveSession?: InstanceType<typeof LiveSession>;
}

interface JwtPayload {
    user: { id: string; role: string; name?: string; email?: string };
}

const HOST_ROLES = ['instructor', 'admin', 'super_admin', 'assistant_instructor'];
const ADMIN_ROLES = ['admin', 'super_admin'];

export const streamAuthenticate = (req: StreamAuthRequest, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) { res.status(401).json({ success: false, message: 'Authentication required', code: 'TOKEN_MISSING' }); return; }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = decoded.user;
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'TOKEN_INVALID' });
    }
};

export const requireHostRole = (req: StreamAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
    if (!HOST_ROLES.includes(req.user.role)) { res.status(403).json({ success: false, message: 'Only instructors and admins can manage live sessions' }); return; }
    next();
};

export const requireAdminRole = (req: StreamAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
    if (!ADMIN_ROLES.includes(req.user.role)) { res.status(403).json({ success: false, message: 'Admin access required' }); return; }
    next();
};

export const requireCourseEnrollment = async (req: StreamAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
    if (ADMIN_ROLES.includes(req.user.role)) { next(); return; }
    const sessionId = req.params.id || req.params.sessionId;
    try {
        const session = await LiveSession.findById(sessionId).lean();
        if (!session) { res.status(404).json({ success: false, message: 'Live session not found' }); return; }
        if (HOST_ROLES.includes(req.user.role) && session.hostId.toString() === req.user.id) {
            (req as any).liveSession = session; next(); return;
        }
        const user = await User.findById(req.user.id).select('enrolledCourses courseEnrollments').lean();
        if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
        
        const courseIdStr = session.courseId.toString();
        
        // 1. Check User model enrollments
        let isEnrolled =
            (user.enrolledCourses || []).some((id: mongoose.Types.ObjectId) => id.toString() === courseIdStr) ||
            (user.courseEnrollments || []).some((e: any) => e.courseId?.toString() === courseIdStr && (e.status === 'active' || e.approvalStatus === 'approved'));

        // 2. Fallback: Check Course model if not found in User (sometimes out of sync)
        if (!isEnrolled) {
            const course = await mongoose.model('Course').findById(courseIdStr).select('enrolledStudents').lean() as any;
            if (course && course.enrolledStudents) {
                isEnrolled = course.enrolledStudents.some((id: mongoose.Types.ObjectId) => id.toString() === req.user!.id);
            }
        }

        if (!isEnrolled) { 
            res.status(403).json({ 
                success: false, 
                message: 'This live session is only for students enrolled in this course. Please enroll first to join.', 
                code: 'NOT_ENROLLED' 
            }); 
            return; 
        }
        (req as any).liveSession = session;
        next();
    } catch (err: any) {
        logger.error(`[StreamAuth] Enrollment check failed: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server error during authorization' });
    }
};

export const requireSessionOwner = async (req: StreamAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ success: false, message: 'Authentication required' }); return; }
    if (ADMIN_ROLES.includes(req.user.role)) { next(); return; }
    const sessionId = req.params.id || req.params.sessionId;
    try {
        const session = await LiveSession.findById(sessionId).lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        if (session.hostId.toString() !== req.user.id) { res.status(403).json({ success: false, message: 'Only the session host can perform this action' }); return; }
        next();
    } catch (err: any) {
        logger.error(`[StreamAuth] Owner check failed: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
