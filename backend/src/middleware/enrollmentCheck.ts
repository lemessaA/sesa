import type { Response, NextFunction } from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import logger from '../utils/logger.js';
import type { AuthRequest } from './auth.js';
import type { CourseAccessInfo } from './courseAccess.js';

/**
 * Enrollment Check Middleware
 * Verifies if user has access to a specific course
 * Attaches access info to request for use in controllers
 */

/**
 * Check if user has enrollment for a specific course
 * Attaches access info to request.courseAccess
 */
export const checkCourseEnrollment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    // Fetch course
    const course = await Course.findById(courseId).select('price lessons');
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found',
      });
      return;
    }

    // Initialize default access (no access)
    const accessInfo: CourseAccessInfo = {
      courseId,
      hasPaidAccess: false,
      hasApprovedAccess: false,
      enrollmentStatus: 'none',
      accessLevel: 'none',
    };

    // Check if course is free (price = 0)
    if ((course.price || 0) === 0) {
      accessInfo.accessLevel = 'free';
      req.courseAccess = accessInfo;
      return next();
    }

    // If user is not authenticated, they can only see free content
    if (!req.user?.id) {
      req.courseAccess = accessInfo;
      return next();
    }

    // Fetch user with enrollments
    const user = await User.findById(req.user.id).select('courseEnrollments');
    if (!user) {
      req.courseAccess = accessInfo;
      return next();
    }

    // Check if user has enrollment for this course
    const enrollment = user.courseEnrollments?.find(
      (e) => e.courseId.toString() === courseId
    );

    if (enrollment) {
      // Check if enrollment is still active
      if (enrollment.status === 'active') {
        if (enrollment.accessLevel === 'paid') {
          accessInfo.hasPaidAccess = true;
          accessInfo.accessLevel = 'paid';
          accessInfo.enrollmentStatus = 'paid';
        }

        // Check expiration
        if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
          accessInfo.hasPaidAccess = false;
          accessInfo.enrollmentStatus = 'none';
        }
      } else {
        accessInfo.enrollmentStatus = enrollment.status as any;
      }
    }

    // Check if first lesson is free (preview access)
    if (!accessInfo.hasPaidAccess && course.lessons && course.lessons.length > 0) {
      const firstLesson = course.lessons[0];
      if (firstLesson.isFree) {
        accessInfo.accessLevel = 'free';
      }
    }

    req.courseAccess = accessInfo;
    next();
  } catch (error) {
    logger.error('Error in checkCourseEnrollment middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking course enrollment',
    });
  }
};

/**
 * Require full course access (paid enrollment)
 * Use after checkCourseEnrollment middleware
 */
export const requireCourseAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.courseAccess?.hasPaidAccess) {
    res.status(403).json({
      success: false,
      message: 'You do not have access to this course. Please enroll to continue.',
      code: 'COURSE_ACCESS_DENIED',
    });
    return;
  }

  next();
};

/**
 * Require paid course access (not just free preview)
 * Use after checkCourseEnrollment middleware
 */
export const requirePaidAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.courseAccess?.accessLevel !== 'paid') {
    res.status(403).json({
      success: false,
      message: 'This content requires a paid enrollment. Please unlock the full course.',
      code: 'PAID_ACCESS_REQUIRED',
    });
    return;
  }

  next();
};

/**
 * Get access info for a course (for API responses)
 */
export const getAccessInfo = (req: AuthRequest) => {
  return req.courseAccess || {
    courseId: '',
    hasPaidAccess: false,
    hasApprovedAccess: false,
    enrollmentStatus: 'none',
    accessLevel: 'none',
  };
};

export default checkCourseEnrollment;
