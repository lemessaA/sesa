import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Quiz from '../models/Quiz.js';
import Course from '../models/Course.js';
import { UserRole } from '../models/User.js';
import { GamificationService } from '../services/gamificationService.js';

/**
 * @route   POST /api/quizzes
 * @desc    Create a new quiz
 * @access  Private (Teacher/Admin)
 */
export const createQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, lessonId, title, description, questions, timeLimit, passingScore } = req.body;
        const userId = req.user!.id;

        // Verify course exists and user is instructor
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const isInstructor = course.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to create quiz for this course' });
        }

        const quiz = new Quiz({
            courseId,
            lessonId,
            title,
            description,
            questions,
            timeLimit,
            passingScore: passingScore || 70,
            createdBy: userId,
            attempts: []
        });

        await quiz.save();

        // Add quiz reference to course
        if (!course.quizzes) {
            course.quizzes = [];
        }
        course.quizzes.push(quiz._id);
        await course.save();

        res.status(201).json({
            message: 'Quiz created successfully',
            quiz
        });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/quizzes/course/:courseId
 * @desc    Get all quizzes for a course
 * @access  Private
 */
export const getCourseQuizzes = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user!.id;

        const quizzes = await Quiz.find({ courseId, isActive: true })
            .select('-attempts')
            .sort({ createdAt: -1 });

        res.json(quizzes);
    } catch (error) {
        console.error('Get course quizzes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   GET /api/quizzes/:quizId
 * @desc    Get quiz details
 * @access  Private
 */
export const getQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.params;
        const userId = req.user!.id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // For students, don't send correct answers
        if (req.user!.role === UserRole.STUDENT) {
            const quizData = quiz.toObject();
            quizData.questions = quizData.questions.map(q => ({
                ...q,
                correctAnswer: undefined,
                explanation: undefined
            }));
            
            // Include student's previous attempts
            const studentAttempts = quiz.attempts.filter(
                attempt => attempt.studentId.toString() === userId
            );

            return res.json({
                ...quizData,
                studentAttempts
            });
        }

        res.json(quiz);
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   POST /api/quizzes/:quizId/submit
 * @desc    Submit quiz attempt
 * @access  Private (Student)
 */
export const submitQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.params;
        const { answers, startedAt } = req.body;
        const userId = req.user!.id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        let score = 0;
        let totalPoints = 0;
        const gradedAnswers = answers.map((answer: any, index: number) => {
            const question = quiz.questions[index];
            totalPoints += question.points;

            let isCorrect = false;
            let pointsEarned = 0;

            if (question.type === 'multiple-choice' || question.type === 'true-false') {
                isCorrect = answer.answer === question.correctAnswer;
                pointsEarned = isCorrect ? question.points : 0;
            } else if (question.type === 'short-answer') {
                // For short answer, mark as needs manual grading
                isCorrect = undefined;
                pointsEarned = 0;
            }

            score += pointsEarned;

            return {
                questionIndex: index,
                answer: answer.answer,
                isCorrect,
                pointsEarned
            };
        });

        const percentage = (score / totalPoints) * 100;
        const completedAt = new Date();
        const timeSpent = Math.floor((completedAt.getTime() - new Date(startedAt).getTime()) / 1000);

        const attempt = {
            studentId: userId,
            answers: gradedAnswers,
            score,
            totalPoints,
            percentage,
            startedAt: new Date(startedAt),
            completedAt,
            timeSpent
        };

        quiz.attempts.push(attempt as any);
        await quiz.save();

        // Award points for gamification using Service
        if (percentage >= quiz.passingScore) {
            await GamificationService.awardPoints(userId, percentage === 100 ? 'quiz_perfect' : 'quiz_pass', {
                sourceId: quizId,
                reason: percentage === 100 ? `Perfect score on quiz: ${quiz.title}` : `Passed quiz: ${quiz.title}`,
                points: Math.floor(score * 10) + (percentage === 100 ? 100 : 0)
            });
            
            // Update streak
            await GamificationService.updateStreak(userId);
        }

        res.json({
            message: 'Quiz submitted successfully',
            result: {
                score,
                totalPoints,
                percentage,
                passed: percentage >= quiz.passingScore,
                timeSpent
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


/**
 * @route   GET /api/quizzes/:quizId/results
 * @desc    Get quiz results for all students (Teacher/Admin)
 * @access  Private (Teacher/Admin)
 */
export const getQuizResults = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.params;

        const quiz = await Quiz.findById(quizId)
            .populate('attempts.studentId', 'name email');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const results = quiz.attempts.map(attempt => ({
            student: attempt.studentId,
            score: attempt.score,
            totalPoints: attempt.totalPoints,
            percentage: attempt.percentage,
            timeSpent: attempt.timeSpent,
            completedAt: attempt.completedAt
        }));

        res.json({
            quizTitle: quiz.title,
            totalAttempts: results.length,
            averageScore: results.reduce((sum, r) => sum + r.percentage, 0) / results.length || 0,
            results
        });
    } catch (error) {
        console.error('Get quiz results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   PUT /api/quizzes/:quizId
 * @desc    Update quiz
 * @access  Private (Teacher/Admin)
 */
export const updateQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.params;
        const updates = req.body;
        const userId = req.user!.id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Verify authorization
        const course = await Course.findById(quiz.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        Object.assign(quiz, updates);
        await quiz.save();

        res.json({
            message: 'Quiz updated successfully',
            quiz
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @route   DELETE /api/quizzes/:quizId
 * @desc    Delete quiz
 * @access  Private (Teacher/Admin)
 */
export const deleteQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.params;
        const userId = req.user!.id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Verify authorization
        const course = await Course.findById(quiz.courseId);
        const isInstructor = course?.instructor.toString() === userId;
        const isAdmin = req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;

        if (!isInstructor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Soft delete
        quiz.isActive = false;
        await quiz.save();

        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
