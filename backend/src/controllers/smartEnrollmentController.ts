import type { Response } from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import type { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get user's course enrollments with access levels
 * GET /api/users/course-enrollments
 */
export const getUserCourseEnrollments = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('Authentication required', 401));
    }

    const user = await User.findById(userId)
      .select('courseEnrollments')
      .populate({
        path: 'courseEnrollments.courseId',
        select: 'title price gradeLevel level'
      });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      enrollments: user.courseEnrollments || []
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Check user's access to a specific course
 * GET /api/courses/:courseId/access-check
 */
export const checkCourseAccessLevel = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Verify course exists
    const course = await Course.findById(courseId).select('lessons price');
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Check if user is admin - admins get full access for preview purposes
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator';

    let accessInfo = {
      courseId,
      hasAccess: isAdmin, // Admins get full access
      accessLevel: isAdmin ? 'paid' as const : 'none' as 'free' | 'paid' | 'none',
      lessonsAccessible: isAdmin ? (course.lessons?.length || 0) : 0,
      totalLessons: course.lessons?.length || 0,
      canUnlock: !isAdmin, // Admins don't need to unlock
      price: course.price
    };

    // Count free lessons
    const freeLessons = course.lessons?.filter(l => l.isFree)?.length || 0;
    if (!isAdmin) {
      accessInfo.lessonsAccessible = freeLessons;
    }

    // If user is authenticated and not admin, check enrollment
    if (userId && !isAdmin) {
      const user = await User.findById(userId).select('courseEnrollments');
      
      if (user && user.courseEnrollments) {
        const enrollment = user.courseEnrollments.find(
          e => e.courseId.toString() === courseId
        );

        if (enrollment) {
          if (enrollment.accessLevel === 'paid' && enrollment.status === 'active') {
            accessInfo.hasAccess = true;
            accessInfo.accessLevel = 'paid';
            accessInfo.lessonsAccessible = course.lessons?.length || 0;
            accessInfo.canUnlock = false;
          } else if (enrollment.approvalStatus === 'approved' && enrollment.status === 'active') {
            accessInfo.hasAccess = true;
            accessInfo.accessLevel = 'paid';
            accessInfo.lessonsAccessible = course.lessons?.length || 0;
            accessInfo.canUnlock = false;
          }
        }
      }
    }

    res.json({
      success: true,
      ...accessInfo
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get course with access information for user
 * GET /api/courses/:courseId/with-access
 */
export const getCourseWithAccess = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const course = await Course.findById(courseId)
      .populate('instructor', 'name profileImage')
      .populate('category', 'name');

    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Check if user is admin - admins get full access for preview purposes
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator';

    // Check user access
    let userAccess = {
      hasPaidAccess: isAdmin, // Admins get full access
      accessLevel: isAdmin ? 'paid' as const : 'free' as 'free' | 'paid' | 'none',
      enrollmentStatus: isAdmin ? 'paid' as const : 'none' as 'none' | 'pending' | 'approved' | 'paid'
    };

    if (userId && !isAdmin) {
      const user = await User.findById(userId).select('courseEnrollments');
      
      if (user && user.courseEnrollments) {
        const enrollment = user.courseEnrollments.find(
          e => e.courseId.toString() === courseId
        );

        if (enrollment) {
          if (enrollment.accessLevel === 'paid' && enrollment.status === 'active') {
            userAccess.hasPaidAccess = true;
            userAccess.accessLevel = 'paid';
            userAccess.enrollmentStatus = 'paid';
          } else if (enrollment.approvalStatus === 'approved' && enrollment.status === 'active') {
            userAccess.hasPaidAccess = true;
            userAccess.accessLevel = 'paid';
            userAccess.enrollmentStatus = 'approved';
          } else if (enrollment.approvalStatus === 'pending') {
            userAccess.enrollmentStatus = 'pending';
          }
        }
      }
    }

    // Add access info to lessons
    const lessonsWithAccess = course.lessons?.map(lesson => {
      const lessonDoc = lesson as any; // Cast to access Mongoose document properties
      return {
        _id: lessonDoc._id || lessonDoc.id,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        order: lesson.order,
        description: lesson.description,
        resources: lesson.resources,
        isFree: lesson.isFree || false,
        isAccessible: lesson.isFree || userAccess.hasPaidAccess
      };
    }) || [];

    res.json({
      success: true,
      course: {
        ...course.toObject?.() || course,
        lessons: lessonsWithAccess,
        userAccess,
        canUnlock: !userAccess.hasPaidAccess && course.price > 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get specific lesson with access check
 * GET /api/courses/:courseId/lessons/:lessonId
 */
export const getLesson = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Get course and find lesson
    const course = await Course.findById(courseId).select('lessons price');
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    const lesson = course.lessons?.find(l => {
      const lId = (l as any)._id?.toString?.() || (l as any).id?.toString?.();
      return lId === lessonId;
    });
    if (!lesson) {
      return next(new AppError('Lesson not found', 404));
    }

    // Check if user is admin - admins get full access for preview purposes
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator';

    // Check access
    let hasAccess = lesson.isFree || isAdmin; // Free lessons accessible to all, admins get full access

    if (!hasAccess && userId) {
      const user = await User.findById(userId).select('courseEnrollments');
      
      if (user && user.courseEnrollments) {
        const enrollment = user.courseEnrollments.find(
          e => e.courseId.toString() === courseId && 
               (e.accessLevel === 'paid' || e.approvalStatus === 'approved') &&
               e.status === 'active'
        );
        hasAccess = !!enrollment;
      }
    }

    if (!hasAccess) {
      return next(new AppError('Access denied. Please purchase this course.', 403));
    }

    // Find next and previous lessons
    const lessonIndex = course.lessons?.findIndex(l => {
      const lId = (l as any)._id?.toString?.() || (l as any).id?.toString?.();
      return lId === lessonId;
    }) || -1;
    const nextLesson = lessonIndex >= 0 && lessonIndex < (course.lessons?.length || 0) - 1
      ? course.lessons?.[lessonIndex + 1]
      : null;
    const previousLesson = lessonIndex > 0
      ? course.lessons?.[lessonIndex - 1]
      : null;

    res.json({
      success: true,
      lesson: {
        ...lesson,
        isAccessible: hasAccess,
        nextLessonId: (nextLesson as any)?._id || (nextLesson as any)?.id,
        previousLessonId: (previousLesson as any)?._id || (previousLesson as any)?.id
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all lessons for a course (with access filtering)
 * GET /api/courses/:courseId/lessons
 */
export const getCourseLessons = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const course = await Course.findById(courseId).select('lessons price');
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Check if user is admin - admins get full access for preview purposes
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'moderator';

    // Check user access
    let hasPaidAccess = isAdmin; // Admins get full access

    if (userId && !isAdmin) {
      const user = await User.findById(userId).select('courseEnrollments');
      
      if (user && user.courseEnrollments) {
        const enrollment = user.courseEnrollments.find(
          e => e.courseId.toString() === courseId && 
               (e.accessLevel === 'paid' || e.approvalStatus === 'approved') &&
               e.status === 'active'
        );
        hasPaidAccess = !!enrollment;
      }
    }

    // Filter lessons based on access
    const lessons = course.lessons?.map(lesson => ({
      _id: (lesson as any)._id || (lesson as any).id,
      title: lesson.title,
      order: lesson.order,
      isFree: lesson.isFree,
      isAccessible: lesson.isFree || hasPaidAccess,
      description: lesson.isFree || hasPaidAccess ? lesson.description : undefined,
      videoUrl: lesson.isFree || hasPaidAccess ? lesson.videoUrl : undefined
    })) || [];

    res.json({
      success: true,
      lessons,
      totalLessons: course.lessons?.length || 0,
      accessibleLessons: lessons.filter(l => l.isAccessible).length,
      userHasPaidAccess: hasPaidAccess
    });
  } catch (err) {
    next(err);
  }
};
