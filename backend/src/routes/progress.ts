import express from 'express';
import type { Response } from 'express';
import Progress from '../models/Progress.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { GamificationService } from '../services/gamificationService.js';
import Course from '../models/Course.js';
import { userCourseRefQuery, userRefQuery } from '../utils/normalizedRefs.js';

const router = express.Router();

// @route   POST api/progress/update
// @desc    Update watch counts and minutes for a course
// @access  Private
router.post('/update', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, minutesWatched } = req.body;
        const userId = req.user!.id;

        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        let progress = await Progress.findOne(userCourseRefQuery(userId, courseId));

        if (!progress) {
            progress = new Progress({
                user: userId,
                course: courseId,
                userId: userId,
                courseId: courseId,
                watchCount: 1,
                totalMinutesWatched: minutesWatched || 0,
                lastWatchedAt: new Date()
            });
        } else {
            progress.watchCount += 1;
            progress.totalMinutesWatched += minutesWatched || 0;
            progress.lastWatchedAt = new Date();
        }

        await progress.save();

        // Activity detected, update streak
        await GamificationService.updateStreak(userId);

        res.json(progress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/progress/complete-lesson
// @desc    Mark a lesson as completed and award points
// @access  Private
router.post('/complete-lesson', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, lessonIndex } = req.body;
        const userId = req.user!.id;

        if (courseId === undefined || lessonIndex === undefined) {
            return res.status(400).json({ message: 'Course ID and Lesson Index are required' });
        }

        let progress = await Progress.findOne(userCourseRefQuery(userId, courseId));
        const course = await Course.findById(courseId);

        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (!progress) {
            progress = new Progress({
                user: userId,
                course: courseId,
                userId: userId,
                courseId: courseId,
                completedLessons: [lessonIndex]
            });
        } else {
            if (progress.completedLessons.includes(lessonIndex)) {
                return res.json({ message: 'Lesson already completed', progress });
            }
            progress.completedLessons.push(lessonIndex);
        }

        // Calculate completion percentage
        const totalLessons = course.lessons.length;
        if (totalLessons > 0) {
            progress.completionPercentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
            if (progress.completionPercentage >= 100) {
                progress.completed = true;
                
                // Award points for course completion if not already awarded
                await GamificationService.awardPoints(userId, 'course_complete', {
                    sourceId: courseId,
                    reason: `Completed full course: ${course.title}`
                });
            }
        }

        progress.lastWatchedAt = new Date();
        await progress.save();

        // Award points for lesson completion
        const result = await GamificationService.awardPoints(userId, 'lesson_complete', {
            sourceId: courseId,
            reason: `Completed lesson: ${course.lessons[lessonIndex]?.title || 'Lesson ' + (lessonIndex + 1)}`
        });

        // Update streak
        await GamificationService.updateStreak(userId);

        res.json({
            message: 'Lesson completed successfully',
            progress,
            pointsAwarded: result.pointsAwarded,
            totalPoints: result.totalPoints,
            leveledUp: result.leveledUp
        });
    } catch (err) {
        console.error('Complete lesson error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/progress/:courseId
// @desc    Get progress for a specific course
// @access  Private
router.get('/:courseId', authenticate, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { courseId } = req.params;

        const progress = await Progress.findOne(userCourseRefQuery(userId, courseId));
        if (!progress) {
            return res.json({ watchCount: 0, totalMinutesWatched: 0 });
        }

        res.json(progress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/progress
// @desc    Get all progress records for current user
// @access  Private
router.get('/', authenticate, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const progressRecords = await Progress.find(userRefQuery(userId)).populate('course courseId', 'title');
        res.json(progressRecords);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
