import express from 'express';
import type { Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { UserRole } from '../models/User.js';
import Course from '../models/Course.js';
import { authenticate, authorize, checkRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Validation middleware
const validate = (req: any, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const mapIncomingRoleToDbRole = (role: string): UserRole | null => {
    const r = role.toLowerCase();
    if (r === 'student') return UserRole.STUDENT;
    if (r === 'premium_student') return UserRole.PREMIUM_STUDENT;
    if (r === 'admin') return UserRole.ADMIN;
    if (r === 'moderator') return UserRole.MODERATOR;
    if (r === 'super_admin') return UserRole.SUPER_ADMIN;
    if (r === 'teacher' || r === 'instructor') return UserRole.INSTRUCTOR;
    if (r === 'assistant_instructor') return UserRole.ASSISTANT_INSTRUCTOR;
    return null;
};

const getApprovedEnrollmentCount = (course: any): number => {
    const approvedFromLegacy = course.students.filter((entry: any) => entry.status === 'approved').length;
    return Math.max(approvedFromLegacy, course.enrolledStudents.length);
};

// @route   GET api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/users/dashboard-data
// @desc    Role-based dashboard data from real MongoDB collections
// @access  Private
router.get('/dashboard-data', authenticate, async (req: any, res: Response) => {
    try {
        const userId = String(req.user.id);
        const userRole = String(req.user.role);
        const isAdminLike = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN || userRole === UserRole.MODERATOR;
        const isInstructorLike = userRole === UserRole.INSTRUCTOR || userRole === UserRole.ASSISTANT_INSTRUCTOR;
        const isStudentLike = userRole === UserRole.STUDENT || userRole === UserRole.PREMIUM_STUDENT;

        if (isAdminLike) {
            const [users, courses] = await Promise.all([
                User.find().select('-password').sort({ createdAt: -1 }),
                Course.find().populate('instructor', 'name email role').populate('category', 'name icon').sort({ createdAt: -1 }),
            ]);

            const enrollmentStats = {
                approved: 0,
                pending: 0,
                rejected: 0
            };

            courses.forEach(course => {
                // Use the summary arrays which are synced with the students array
                enrollmentStats.approved += course.enrolledStudents.length;
                enrollmentStats.pending += course.pendingApprovals.length;

                // Rejected counts are only in the legacy students array
                course.students.forEach(s => {
                    if (s.status === 'rejected') enrollmentStats.rejected++;
                });
            });

            const approvedEnrollmentsPerCourse = courses.map((course) => getApprovedEnrollmentCount(course));

            const totalApprovedEnrollments = approvedEnrollmentsPerCourse.reduce((sum, count) => sum + count, 0);
            const totalRevenue = courses.reduce((sum, course) => {
                return sum + (course.price || 0) * getApprovedEnrollmentCount(course);
            }, 0);

            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

            const monthlyRevenue = courses
                .filter((course) => course.createdAt >= oneMonthAgo)
                .reduce((sum, course) => sum + (course.price || 0) * getApprovedEnrollmentCount(course), 0);

            const userMap = new Map(users.map((user) => [user._id.toString(), user]));

            const pendingQueue = courses.flatMap((course) => {
                const pendingIds = new Set<string>([
                    ...course.pendingApprovals.map((id) => id.toString()),
                    ...course.students
                        .filter((entry) => entry.status === 'pending')
                        .map((entry) => entry.studentId.toString()),
                ]);

                return Array.from(pendingIds)
                    .map((studentId) => {
                        const student = userMap.get(studentId);
                        if (!student) return null;

                        const legacyPending = course.students.find(
                            (entry) => entry.studentId.toString() === studentId && entry.status === 'pending'
                        );

                        return {
                            courseId: course._id,
                            courseTitle: course.title,
                            student: {
                                _id: student._id,
                                name: student.name,
                                email: student.email,
                                role: student.role,
                            },
                            requestedAt: legacyPending?.enrolledAt ?? course.createdAt,
                        };
                    })
                    .filter(Boolean);
            });

            return res.json({
                role: userRole,
                users,
                courses,
                pendingQueue,
                enrollmentStats,
                revenueStats: {
                    totalRevenue,
                    monthlyRevenue,
                    totalApprovedEnrollments,
                    totalCourses: courses.length,
                    totalUsers: users.length,
                },
            });
        }

        if (isInstructorLike) {
            const courses = await Course.find({ instructor: userId })
                .populate('instructor', 'name email role')
                .populate('category', 'name icon')
                .sort({ createdAt: -1 });

            const enrollmentStats = {
                approved: 0,
                pending: 0,
                rejected: 0
            };

            courses.forEach(course => {
                // Use summary arrays
                enrollmentStats.approved += course.enrolledStudents.length;
                enrollmentStats.pending += course.pendingApprovals.length;

                // Rejected counts are only in the students array
                course.students.forEach(s => {
                    if (s.status === 'rejected') enrollmentStats.rejected++;
                });
            });

            const approvedStudentIds = new Set<string>();
            const pendingStudentIds = new Set<string>();

            courses.forEach((course) => {
                course.enrolledStudents.forEach((studentId) => approvedStudentIds.add(studentId.toString()));
                course.students.forEach((entry) => {
                    if (entry.status === 'approved') approvedStudentIds.add(entry.studentId.toString());
                    if (entry.status === 'pending') pendingStudentIds.add(entry.studentId.toString());
                });
                course.pendingApprovals.forEach((studentId) => pendingStudentIds.add(studentId.toString()));
            });

            const allStudentIds = Array.from(new Set([...approvedStudentIds, ...pendingStudentIds]));
            const students = allStudentIds.length > 0
                ? await User.find({ _id: { $in: allStudentIds } }).select('-password').sort({ createdAt: -1 })
                : [];

            const pendingQueue = courses.flatMap((course) => {
                return course.pendingApprovals.map((studentId) => {
                    const student = students.find((s) => s._id.toString() === studentId.toString());
                    if (!student) return null;

                    return {
                        courseId: course._id,
                        courseTitle: course.title,
                        student: {
                            _id: student._id,
                            name: student.name,
                            email: student.email,
                            role: student.role,
                        },
                        requestedAt: course.createdAt, // Fallback as legacy pending info might be missing
                    };
                }).filter(Boolean);
            });

            return res.json({
                role: userRole,
                courses,
                students,
                pendingQueue,
                enrollmentStats
            });
        }

        if (isStudentLike) {
            const [courses, pendingCourses] = await Promise.all([
                Course.find({
                    status: 'approved',
                    isPublished: true,
                    enrolledStudents: userId,
                })
                    .populate('instructor', 'name email role')
                    .populate('category', 'name icon')
                    .sort({ createdAt: -1 }),
                Course.find({
                    status: 'approved',
                    isPublished: true,
                    pendingApprovals: userId,
                })
                    .select('title description thumbnailUrl youtubeVideoId previewVideoUrl resourceUrl createdAt')
                    .populate('instructor', 'name email role')
                    .sort({ createdAt: -1 }),
            ]);

            return res.json({
                role: userRole,
                courses,
                pendingCourses,
            });
        }

        res.status(400).json({ message: 'Unsupported role for dashboard data' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/users/stats
// @desc    Get user statistics (role-specific)
// @access  Private
router.get('/stats', authenticate, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === UserRole.STUDENT) {
            const [approvedCourses, pendingCourses] = await Promise.all([
                Course.countDocuments({ enrolledStudents: userId }),
                Course.countDocuments({ pendingApprovals: userId }),
            ]);

            const stats = {
                enrolledCourses: approvedCourses + pendingCourses,
                approvedCourses,
                pendingCourses,
            };

            return res.json(stats);
        }

        if (userRole === UserRole.INSTRUCTOR) {
            const myCourses = await Course.find({ instructor: userId });

            let totalStudents = 0;
            let pendingEnrollments = 0;

            myCourses.forEach(course => {
                const approvedFromLegacy = course.students.filter(s => s.status === 'approved').length;
                totalStudents += Math.max(approvedFromLegacy, course.enrolledStudents.length);
                pendingEnrollments += course.pendingApprovals.length;
            });

            const stats = {
                totalCourses: myCourses.length,
                totalStudents,
                pendingEnrollments,
                averageRating: 0
            };

            return res.json(stats);
        }

        if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
            const totalUsers = await User.countDocuments();
            const totalCourses = await Course.countDocuments();

            const pendingApprovals = await Course.aggregate([
                {
                    $project: {
                        pendingCount: { $size: { $ifNull: ['$pendingApprovals', []] } },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$pendingCount' },
                    },
                },
            ]);

            const stats = {
                totalUsers,
                totalCourses,
                pendingApprovals: pendingApprovals[0]?.total ?? 0,
            };

            return res.json(stats);
        }

        res.status(400).json({ message: 'Invalid role' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
    '/profile',
    authenticate,
    [
        body('name').optional().trim().notEmpty().escape(),
        body('email').optional().isEmail().normalizeEmail(),
        body('password').optional().isLength({ min: 6 })
    ],
    validate,
    async (req: any, res: Response) => {
        try {
            const { name, email, password } = req.body;
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if email is already taken by another user
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
                user.email = email;
            }

            if (name) user.name = name;

            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }

            await user.save();

            res.json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   GET api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize([UserRole.ADMIN]), async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments();

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/users/change-role
// @desc    Change user role (admin only)
// @access  Private (Admin)
router.put(
    '/change-role',
    authenticate,
    checkRole(['admin']),
    [
        body('userId', 'Valid userId is required').isMongoId(),
        body('role', 'Role must be student, instructor, admin, or super_admin').isIn([
            'student',
            'teacher',
            'admin',
            'instructor',
            'super_admin',
        ])
    ],
    validate,
    async (req: any, res: Response) => {
        try {
            const { userId, role } = req.body;

            const mappedRole = mapIncomingRoleToDbRole(role);
            if (!mappedRole) {
                return res.status(400).json({ message: 'Invalid role' });
            }

            const actorRole = String(req.user?.role || '');
            if (mappedRole === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
                return res.status(403).json({ message: 'Only super_admin can assign super_admin role' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
                return res.status(403).json({ message: 'Only super_admin can modify this account' });
            }

            user.role = mappedRole;
            await user.save();

            res.json({
                message: 'Role updated successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   GET api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (Admin)
router.get('/:id', authenticate, authorize([UserRole.ADMIN]), async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
