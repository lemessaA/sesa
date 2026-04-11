import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkCourseAccess } from '../middleware/courseAccess.js';
import {
  getUserCourseEnrollments,
  checkCourseAccessLevel,
  getCourseWithAccess,
  getLesson,
  getCourseLessons
} from '../controllers/smartEnrollmentController.js';

const router = express.Router();

/**
 * Get user's course enrollments with access levels
 * GET /api/smart-enrollment/my-enrollments
 */
router.get('/my-enrollments', authenticate, getUserCourseEnrollments);

/**
 * Check user's access to a specific course
 * GET /api/smart-enrollment/courses/:courseId/access-check
 */
router.get('/courses/:courseId/access-check', authenticate, checkCourseAccessLevel);

/**
 * Get course with access information for user
 * GET /api/smart-enrollment/courses/:courseId/with-access
 */
router.get('/courses/:courseId/with-access', checkCourseAccess('courseId'), getCourseWithAccess);

/**
 * Get all lessons for a course (with access filtering)
 * GET /api/smart-enrollment/courses/:courseId/lessons
 */
router.get('/courses/:courseId/lessons', checkCourseAccess('courseId'), getCourseLessons);

/**
 * Get specific lesson with access check
 * GET /api/smart-enrollment/courses/:courseId/lessons/:lessonId
 */
router.get('/courses/:courseId/lessons/:lessonId', checkCourseAccess('courseId'), getLesson);

export default router;
