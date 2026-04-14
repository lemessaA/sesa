import type { Response, NextFunction } from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import type { AuthRequest } from './auth.js';

export interface CourseAccessInfo {
  courseId: string;
  hasPaidAccess: boolean;
  hasApprovedAccess: boolean;
  enrollmentStatus: 'none' | 'pending' | 'approved' | 'paid';
  accessLevel: 'free' | 'paid' | 'none';
}

/**
 * Middleware to check user's access level to a specific course
 * Attaches courseAccess info to request for use in controllers
 */
export const checkCourseAccess = (courseIdParam: string = 'courseId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params[courseIdParam];
      
      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check if user is admin - admins get full access for preview purposes
      const userRole = req.user?.role;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator';

      // Initialize access info
      const accessInfo: CourseAccessInfo = {
        courseId,
        hasPaidAccess: isAdmin, // Admins get full access
        hasApprovedAccess: isAdmin, // Admins get full access
        enrollmentStatus: isAdmin ? 'paid' : 'none',
        accessLevel: isAdmin ? 'paid' : 'free'
      };

      // If user is authenticated and not admin, check their enrollment
      if (req.user && !isAdmin) {
        const user = await User.findById(req.user.id).select('courseEnrollments');
        
        if (user && user.courseEnrollments) {
          const enrollment = user.courseEnrollments.find(
            e => e.courseId.toString() === courseId
          );

          if (enrollment) {
            // Check paid access
            if (enrollment.accessLevel === 'paid' && enrollment.status === 'active') {
              accessInfo.hasPaidAccess = true;
              accessInfo.accessLevel = 'paid';
              accessInfo.enrollmentStatus = 'paid';
            }
            // Check approved access (from admin approval workflow)
            else if (enrollment.approvalStatus === 'approved' && enrollment.status === 'active') {
              accessInfo.hasApprovedAccess = true;
              accessInfo.accessLevel = 'paid';
              accessInfo.enrollmentStatus = 'approved';
            }
            // Check pending approval
            else if (enrollment.approvalStatus === 'pending') {
              accessInfo.enrollmentStatus = 'pending';
            }
          }
        }
      }

      // Attach to request for use in controllers
      req.courseAccess = accessInfo;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Middleware to require paid access to a course
 * Use after checkCourseAccess middleware
 */
export const requirePaidAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.courseAccess) {
    return res.status(500).json({ message: 'Course access check not performed' });
  }

  if (!req.courseAccess.hasPaidAccess && !req.courseAccess.hasApprovedAccess) {
    return res.status(403).json({
      message: 'Access denied. Please purchase this course to continue.',
      accessLevel: req.courseAccess.accessLevel,
      enrollmentStatus: req.courseAccess.enrollmentStatus
    });
  }

  next();
};

/**
 * Middleware to allow free content access
 * Free lessons are accessible to all authenticated users
 */
export const allowFreeAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required to access free content' });
  }

  next();
};

/**
 * Extend Express Request interface to include courseAccess
 */
declare global {
  namespace Express {
    interface Request {
      courseAccess?: CourseAccessInfo;
    }
  }
}
