import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getUserEnrollments,
  checkCourseAccess,
  enrollUserInCourse,
  getCourseWithAccess,
} from '../controllers/enrollmentController.js';
import { checkCourseEnrollment } from '../middleware/enrollmentCheck.js';

const router = express.Router();

/**
 * Get user's enrollments
 * GET /api/enrollments/my-enrollments
 */
router.get('/my-enrollments', authenticate, getUserEnrollments);

/**
 * Check access to a course
 * GET /api/enrollments/courses/:courseId/access
 */
router.get('/courses/:courseId/access', checkCourseAccess);

/**
 * Get course with access info
 * GET /api/enrollments/courses/:courseId/with-access
 */
router.get('/courses/:courseId/with-access', getCourseWithAccess);

/**
 * Enroll user in a course
 * POST /api/enrollments/enroll
 */
router.post('/enroll', authenticate, enrollUserInCourse);

export default router;
