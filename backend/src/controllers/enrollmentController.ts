import type { Response } from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';
import type { AuthRequest } from '../middleware/auth.js';

/**
 * Get user's course enrollments
 * GET /api/enrollments/my-enrollments
 */
export const getUserEnrollments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await User.findById(userId)
      .select('courseEnrollments')
      .populate({
        path: 'courseEnrollments.courseId',
        select: 'title price gradeLevel level thumbnail',
      });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      enrollments: user.courseEnrollments || [],
    });
  } catch (error) {
    logger.error('Error fetching user enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
    });
  }
};

/**
 * Check access to a specific course
 * GET /api/enrollments/courses/:courseId/access
 */
export const checkCourseAccess = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    // Verify course exists
    const course = await Course.findById(courseId).select('price lessons title');
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found',
      });
      return;
    }

    const accessInfo: {
      courseId: string;
      courseTitle: string;
      hasAccess: boolean;
      accessLevel: 'free' | 'paid' | 'none';
      enrollmentStatus: 'active' | 'expired' | 'cancelled' | 'none';
      canUnlock: boolean;
      price: number;
      isFree: boolean;
    } = {
      courseId,
      courseTitle: course.title,
      hasAccess: false,
      accessLevel: 'none',
      enrollmentStatus: 'none',
      canUnlock: true,
      price: course.price || 0,
      isFree: (course.price || 0) === 0,
    };

    // If course is free (price = 0), everyone has access
    if ((course.price || 0) === 0) {
      accessInfo.hasAccess = true;
      accessInfo.accessLevel = 'free';
      res.json({ success: true, accessInfo });
      return;
    }

    // If not authenticated, check for free preview
    if (!userId) {
      if (course.lessons && course.lessons.length > 0 && course.lessons[0].isFree) {
        accessInfo.hasAccess = true;
        accessInfo.accessLevel = 'free';
      }
      res.json({ success: true, accessInfo });
      return;
    }

    // Check user enrollment
    const user = await User.findById(userId).select('courseEnrollments');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const enrollment = user.courseEnrollments?.find(
      (e) => e.courseId.toString() === courseId
    );

    if (enrollment && enrollment.status === 'active') {
      // Check expiration
      if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
        accessInfo.enrollmentStatus = 'expired';
      } else {
        accessInfo.hasAccess = true;
        accessInfo.accessLevel = enrollment.accessLevel;
        accessInfo.enrollmentStatus = enrollment.status;
      }
    } else if (enrollment) {
      accessInfo.enrollmentStatus = enrollment.status;
    }

    // Check for free preview if no paid access
    if (!accessInfo.hasAccess && course.lessons && course.lessons.length > 0) {
      if (course.lessons[0].isFree) {
        accessInfo.hasAccess = true;
        accessInfo.accessLevel = 'free';
      }
    }

    res.json({ success: true, accessInfo });
  } catch (error) {
    logger.error('Error checking course access:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking access',
    });
  }
};

/**
 * Enroll user in a course (after payment)
 * POST /api/enrollments/enroll
 * Body: { courseId, paymentId?, accessLevel }
 */
export const enrollUserInCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { courseId, paymentId, accessLevel = 'paid' } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!courseId) {
      res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
      return;
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found',
      });
      return;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if already enrolled
    const existingEnrollment = user.courseEnrollments?.find(
      (e) => e.courseId.toString() === courseId
    );

    if (existingEnrollment && existingEnrollment.status === 'active') {
      res.status(400).json({
        success: false,
        message: 'User is already enrolled in this course',
      });
      return;
    }

    // Create or update enrollment
    const enrollment = {
      courseId,
      enrollmentDate: new Date(),
      status: 'active' as const,
      accessLevel: accessLevel as 'free' | 'paid',
      approvalStatus: 'approved' as const,
      paymentId: paymentId || undefined,
    };

    if (!user.courseEnrollments) {
      user.courseEnrollments = [];
    }

    // Remove old enrollment if exists
    user.courseEnrollments = user.courseEnrollments.filter(
      (e) => e.courseId.toString() !== courseId
    );

    // Add new enrollment
    user.courseEnrollments.push(enrollment as any);

    // Also add to enrolledCourses for backward compatibility
    if (!user.enrolledCourses) {
      user.enrolledCourses = [];
    }
    if (!user.enrolledCourses.includes(courseId as any)) {
      user.enrolledCourses.push(courseId as any);
    }

    await user.save();

    logger.info(`User ${userId} enrolled in course ${courseId}`);

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment,
    });
  } catch (error) {
    logger.error('Error enrolling user in course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
    });
  }
};

/**
 * Get course with access info
 * GET /api/enrollments/courses/:courseId/with-access
 */
export const getCourseWithAccess = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    // Fetch course
    const course = await Course.findById(courseId)
      .populate('instructor', 'name profileImage')
      .select('-__v');

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found',
      });
      return;
    }

    // Determine access level
    let accessInfo: {
      hasAccess: boolean;
      accessLevel: 'free' | 'paid' | 'none';
      enrollmentStatus: 'active' | 'expired' | 'cancelled' | 'none';
    } = {
      hasAccess: false,
      accessLevel: 'none',
      enrollmentStatus: 'none',
    };

    // If course is free (price = 0)
    if ((course.price || 0) === 0) {
      accessInfo.hasAccess = true;
      accessInfo.accessLevel = 'free';
    }
    // If user is authenticated
    else if (userId) {
      const user = await User.findById(userId).select('courseEnrollments');
      if (user) {
        const enrollment = user.courseEnrollments?.find(
          (e) => e.courseId.toString() === courseId
        );

        if (enrollment && enrollment.status === 'active') {
          // Check expiration
          if (!enrollment.expiresAt || new Date(enrollment.expiresAt) >= new Date()) {
            accessInfo.hasAccess = true;
            accessInfo.accessLevel = enrollment.accessLevel;
            accessInfo.enrollmentStatus = enrollment.status;
          }
        }

        // Check for free preview
        if (!accessInfo.hasAccess && course.lessons && course.lessons.length > 0) {
          if (course.lessons[0].isFree) {
            accessInfo.hasAccess = true;
            accessInfo.accessLevel = 'free';
          }
        }
      }
    }
    // Not authenticated - check for free preview
    else if (course.lessons && course.lessons.length > 0) {
      if (course.lessons[0].isFree) {
        accessInfo.hasAccess = true;
        accessInfo.accessLevel = 'free';
      }
    }

    // Filter lessons based on access
    const processedLessons = course.lessons?.map((lesson: any) => ({
      ...lesson.toObject ? lesson.toObject() : lesson,
      isAccessible:
        accessInfo.accessLevel === 'paid' ||
        (accessInfo.accessLevel === 'free' && lesson.isFree),
    })) || [];

    res.json({
      success: true,
      course: {
        ...course.toObject ? course.toObject() : course,
        lessons: processedLessons,
        userAccess: accessInfo,
      },
    });
  } catch (error) {
    logger.error('Error fetching course with access:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
    });
  }
};

export default {
  getUserEnrollments,
  checkCourseAccess,
  enrollUserInCourse,
  getCourseWithAccess,
};
