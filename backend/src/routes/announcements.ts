import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import Announcement from '../models/Announcement.js';
import { authenticate, checkRole, type AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = express.Router();

const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        // Try to get user role if authenticated (optional auth)
        let userRole: string | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const jwt = await import('jsonwebtoken');
                const payload: any = jwt.default.verify(
                    authHeader.split(' ')[1],
                    process.env.JWT_SECRET!
                );
                userRole = payload?.user?.role || null;
            } catch {
                // Invalid token — treat as unauthenticated
            }
        }

        const scope = req.query.scope;
        const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN || userRole === UserRole.MODERATOR;

        const query: Record<string, unknown> = {};
        
        // Admins fetching with ?scope=all can see inactive announcements too
        if (!(isAdmin && scope === 'all')) {
            query.isActive = true;
        }

        // Role-based filtering: students see 'student' or 'both', instructors see 'instructor' or 'both',
        // admins/unauthenticated users see everything active
        if (userRole === UserRole.STUDENT || userRole === 'premium_student') {
            query.targetRole = { $in: ['student', 'both'] };
        } else if (userRole === UserRole.INSTRUCTOR || userRole === 'assistant_instructor') {
            query.targetRole = { $in: ['instructor', 'both'] };
        }
        // No targetRole filter for admins/mods (see all) or unauthenticated (see 'both' only)
        if (!userRole) {
            query.targetRole = 'both';
        }

        const announcements = await Announcement.find(query)
            .populate('createdBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(30);

        res.json(announcements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post(
    '/',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
    [
        body('message', 'Message is required').trim().isLength({ min: 1, max: 500 }),
        body('targetRole', 'targetRole must be student, instructor, or both').isIn(['student', 'instructor', 'both']),
        body('isActive').optional().isBoolean(),
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const { message, targetRole, isActive } = req.body;

            const announcement = await Announcement.create({
                message,
                targetRole,
                isActive: typeof isActive === 'boolean' ? isActive : true,
                createdBy: req.user!.id,
            });

            await announcement.populate('createdBy', 'name role');
            res.status(201).json(announcement);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

router.put(
    '/:id/toggle',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
    [body('isActive', 'isActive must be boolean').isBoolean()],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const announcement = await Announcement.findById(req.params.id);
            if (!announcement) {
                return res.status(404).json({ message: 'Announcement not found' });
            }

            announcement.isActive = req.body.isActive;
            await announcement.save();

            res.json({ message: 'Announcement updated', announcement });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Edit announcement endpoint
router.put(
    '/:id',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
    [
        body('message', 'Message is required').trim().isLength({ min: 1, max: 500 }),
        body('targetRole', 'targetRole must be student, instructor, or both').isIn(['student', 'instructor', 'both']),
        body('isActive').optional().isBoolean(),
    ],
    validate,
    async (req: AuthRequest, res: Response) => {
        try {
            const { message, targetRole, isActive } = req.body;
            
            const announcement = await Announcement.findById(req.params.id);
            if (!announcement) {
                return res.status(404).json({ message: 'Announcement not found' });
            }

            // Update the announcement
            announcement.message = message;
            announcement.targetRole = targetRole;
            if (typeof isActive === 'boolean') {
                announcement.isActive = isActive;
            }
            
            await announcement.save();
            await announcement.populate('createdBy', 'name role');

            res.json({ message: 'Announcement updated successfully', announcement });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete announcement endpoint
router.delete(
    '/:id',
    authenticate,
    checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
    async (req: AuthRequest, res: Response) => {
        try {
            const announcement = await Announcement.findById(req.params.id);
            if (!announcement) {
                return res.status(404).json({ message: 'Announcement not found' });
            }

            await Announcement.findByIdAndDelete(req.params.id);
            res.json({ message: 'Announcement deleted successfully' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
