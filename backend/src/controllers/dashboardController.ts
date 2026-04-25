import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import User, { UserRole } from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Payment from '../models/Payment.js';
import Progress from '../models/Progress.js';
import Certificate from '../models/Certificate.js';
import Announcement from '../models/Announcement.js';

/**
 * Get role-specific dashboard data
 */
export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const userRole = req.user!.role;

        let dashboardData: any = {};

        switch (userRole) {
            case UserRole.SUPER_ADMIN:
            case UserRole.ADMIN:
                dashboardData = await getAdminDashboard(userId);
                break;

            case UserRole.MODERATOR:
                dashboardData = await getModeratorDashboard(userId);
                break;

            case UserRole.CONTENT_MANAGER:
                dashboardData = await getContentManagerDashboard(userId);
                break;

            case UserRole.INSTRUCTOR:
            case UserRole.ASSISTANT_INSTRUCTOR:
            case UserRole.GUEST_INSTRUCTOR:
                dashboardData = await getInstructorDashboard(userId);
                break;

            case UserRole.STUDENT:
            case UserRole.PREMIUM_STUDENT:
            case UserRole.TRIAL_STUDENT:
                dashboardData = await getStudentDashboard(userId);
                break;

            case UserRole.FINANCE_MANAGER:
                dashboardData = await getFinanceDashboard(userId);
                break;

            case UserRole.ANALYST:
                dashboardData = await getAnalystDashboard(userId);
                break;

            case UserRole.REVIEWER:
                dashboardData = await getReviewerDashboard(userId);
                break;

            case UserRole.SUPPORT_STAFF:
                dashboardData = await getSupportDashboard(userId);
                break;

            default:
                dashboardData = await getBasicDashboard(userId);
        }

        res.json({
            role: userRole,
            ...dashboardData
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Dashboard
async function getAdminDashboard(userId: string) {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalCourses = await Course.countDocuments();
    const pendingCourses = await Course.countDocuments({ status: 'pending' });
    const totalEnrollments = await Enrollment.countDocuments({ status: 'approved' });
    const pendingEnrollments = await Enrollment.countDocuments({ status: 'pending' });

    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(5);
    const recentCourses = await Course.find().populate('instructor', 'name').sort({ createdAt: -1 }).limit(5);
    const recentPayments = await Payment.find({ status: 'completed' })
        .populate('user', 'name')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(10);

    const totalRevenue = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(3);

    return {
        stats: {
            totalUsers,
            activeUsers,
            totalCourses,
            pendingCourses,
            totalEnrollments,
            pendingEnrollments,
            totalRevenue: totalRevenue[0]?.total || 0
        },
        recentUsers,
        recentCourses,
        recentPayments,
        announcements,
        quickActions: [
            { label: 'Manage Users', route: '/admin/users' },
            { label: 'Approve Courses', route: '/admin/courses/pending' },
            { label: 'Approve Enrollments', route: '/admin/enrollments/pending' },
            { label: 'View Analytics', route: '/admin/analytics' },
            { label: 'Manage Payments', route: '/admin/payments' }
        ]
    };
}

// Moderator Dashboard
async function getModeratorDashboard(userId: string) {
    const pendingEnrollments = await Enrollment.find({ status: 'pending' })
        .populate('user', 'name email')
        .populate('course', 'title')
        .sort({ requestedAt: -1 })
        .limit(20);

    const pendingCourses = await Course.find({ status: 'pending' })
        .populate('instructor', 'name')
        .sort({ createdAt: -1 });

    const recentComments = await Course.find({ 'comments.0': { $exists: true } })
        .select('title comments')
        .sort({ 'comments.createdAt': -1 })
        .limit(10);

    return {
        stats: {
            pendingEnrollments: pendingEnrollments.length,
            pendingCourses: pendingCourses.length
        },
        pendingEnrollments,
        pendingCourses,
        recentComments,
        quickActions: [
            { label: 'Approve Enrollments', route: '/moderator/enrollments' },
            { label: 'Review Courses', route: '/moderator/courses' },
            { label: 'Moderate Comments', route: '/moderator/comments' }
        ]
    };
}

// Content Manager Dashboard
async function getContentManagerDashboard(userId: string) {
    const allCourses = await Course.find()
        .populate('instructor', 'name')
        .sort({ createdAt: -1 });

    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const draftCourses = await Course.countDocuments({ isPublished: false });

    const coursesByCategory = await Course.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } }
    ]);

    return {
        stats: {
            totalCourses: allCourses.length,
            publishedCourses,
            draftCourses
        },
        allCourses,
        coursesByCategory,
        quickActions: [
            { label: 'Manage Courses', route: '/content/courses' },
            { label: 'Manage Categories', route: '/content/categories' },
            { label: 'Content Analytics', route: '/content/analytics' }
        ]
    };
}

// Instructor Dashboard
async function getInstructorDashboard(userId: string) {
    const myCourses = await Course.find({ instructor: userId })
        .populate('category', 'name')
        .sort({ createdAt: -1 });

    const courseIds = myCourses.map(c => c._id);

    const totalEnrollments = await Enrollment.countDocuments({
        course: { $in: courseIds },
        status: 'approved'
    });

    const pendingEnrollments = await Enrollment.find({
        course: { $in: courseIds },
        status: 'pending'
    })
        .populate('user', 'name email')
        .populate('course', 'title')
        .sort({ requestedAt: -1 });

    const totalRevenue = await Payment.aggregate([
        { $match: { course: { $in: courseIds }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const activeStudents = await Progress.distinct('user', {
        course: { $in: courseIds },
        lastWatchedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const recentComments = await Course.find({
        instructor: userId,
        'comments.0': { $exists: true }
    })
        .select('title comments')
        .sort({ 'comments.createdAt': -1 })
        .limit(10);

    return {
        stats: {
            totalCourses: myCourses.length,
            totalEnrollments,
            pendingEnrollments: pendingEnrollments.length,
            totalRevenue: totalRevenue[0]?.total || 0,
            activeStudents: activeStudents.length
        },
        myCourses,
        pendingEnrollments,
        recentComments,
        quickActions: [
            { label: 'Create Course', route: '/instructor/create-course' },
            { label: 'My Courses', route: '/instructor/courses' },
            { label: 'Students', route: '/instructor/students' },
            { label: 'Analytics', route: '/instructor/analytics' }
        ]
    };
}

// Student Dashboard
async function getStudentDashboard(userId: string) {
    const enrollments = await Enrollment.find({ user: userId, status: 'approved' })
        .populate('course')
        .sort({ updatedAt: -1 });

    const courseIds = enrollments.map(e => e.course);

    const progress = await Progress.find({ user: userId, course: { $in: courseIds } });
    const completedCourses = progress.filter(p => p.completed).length;

    const certificates = await Certificate.find({ user: userId })
        .populate('course', 'title')
        .sort({ issuedDate: -1 });

    const recentPayments = await Payment.find({ user: userId })
        .populate('course', 'title price')
        .sort({ createdAt: -1 })
        .limit(5);

    const recommendedCourses = await Course.find({
        isPublished: true,
        status: 'approved',
        _id: { $nin: courseIds }
    })
        .populate('instructor', 'name')
        .limit(6);

    const totalMinutesWatched = progress.reduce((sum, p) => sum + p.totalMinutesWatched, 0);

    return {
        stats: {
            enrolledCourses: enrollments.length,
            completedCourses,
            inProgressCourses: enrollments.length - completedCourses,
            totalHoursWatched: Math.round(totalMinutesWatched / 60),
            certificatesEarned: certificates.length
        },
        enrolledCourses: enrollments,
        progress,
        certificates,
        recentPayments,
        recommendedCourses,
        quickActions: [
            { label: 'Browse Courses', route: '/student/browse' },
            { label: 'My Courses', route: '/student/courses' },
            { label: 'Certificates', route: '/student/certificates' },
            { label: 'Resources', route: '/student/resources' }
        ]
    };
}

// Finance Manager Dashboard
async function getFinanceDashboard(userId: string) {
    const totalRevenue = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const completedPayments = await Payment.countDocuments({ status: 'completed' });
    const refundedPayments = await Payment.countDocuments({ status: 'refunded' });

    const revenueByMonth = await Payment.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: {
                    year: { $year: '$paymentDate' },
                    month: { $month: '$paymentDate' }
                },
                revenue: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    const recentPayments = await Payment.find()
        .populate('user', 'name email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(20);

    return {
        stats: {
            totalRevenue: totalRevenue[0]?.total || 0,
            pendingPayments,
            completedPayments,
            refundedPayments
        },
        revenueByMonth,
        recentPayments,
        quickActions: [
            { label: 'View All Payments', route: '/finance/payments' },
            { label: 'Revenue Reports', route: '/finance/reports' },
            { label: 'Refund Requests', route: '/finance/refunds' }
        ]
    };
}

// Analyst Dashboard
async function getAnalystDashboard(userId: string) {
    const userGrowth = await User.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    const courseEnrollmentTrends = await Enrollment.aggregate([
        { $match: { status: 'approved' } },
        {
            $group: {
                _id: {
                    year: { $year: '$updatedAt' },
                    month: { $month: '$updatedAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
    ]);

    const topCourses = await Enrollment.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$course', enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'courseInfo' } }
    ]);

    return {
        userGrowth,
        courseEnrollmentTrends,
        topCourses,
        quickActions: [
            { label: 'User Analytics', route: '/analyst/users' },
            { label: 'Course Analytics', route: '/analyst/courses' },
            { label: 'Revenue Analytics', route: '/analyst/revenue' },
            { label: 'Generate Reports', route: '/analyst/reports' }
        ]
    };
}

// Reviewer Dashboard
async function getReviewerDashboard(userId: string) {
    const pendingCourses = await Course.find({ status: 'pending' })
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 });

    const recentlyApproved = await Course.find({ status: 'approved' })
        .populate('instructor', 'name')
        .sort({ updatedAt: -1 })
        .limit(10);

    return {
        stats: {
            pendingReviews: pendingCourses.length
        },
        pendingCourses,
        recentlyApproved,
        quickActions: [
            { label: 'Review Courses', route: '/reviewer/courses' },
            { label: 'Review History', route: '/reviewer/history' }
        ]
    };
}

// Support Staff Dashboard
async function getSupportDashboard(userId: string) {
    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(20);
    const pendingEnrollments = await Enrollment.find({ status: 'pending' })
        .populate('user', 'name email')
        .populate('course', 'title')
        .limit(20);

    return {
        recentUsers,
        pendingEnrollments,
        quickActions: [
            { label: 'User Support', route: '/support/users' },
            { label: 'Enrollment Issues', route: '/support/enrollments' },
            { label: 'Payment Issues', route: '/support/payments' }
        ]
    };
}

// Basic Dashboard (fallback)
async function getBasicDashboard(userId: string) {
    const user = await User.findById(userId).select('-password');
    return {
        user,
        message: 'Welcome to your dashboard'
    };
}

function toStudentAgentContext(d: Record<string, any>, role: UserRole) {
    return {
        role,
        stats: d.stats,
        quickActions: d.quickActions,
        enrolledCourses: (d.enrolledCourses || []).map((e: any) => ({
            title: e.course?.title ?? 'Course',
            courseId: String(e.course?._id ?? e.course ?? ''),
        })),
        progress: (d.progress || []).map((p: any) => ({
            courseId: String(p.course?._id ?? p.course ?? ''),
            completed: Boolean(p.completed),
            minutesWatched: p.totalMinutesWatched ?? 0,
        })),
        recommendedCourses: (d.recommendedCourses || []).map((c: any) => ({
            title: c.title,
            courseId: String(c._id),
            level: c.level,
            instructor: c.instructor?.name,
        })),
    };
}

function toInstructorAgentContext(d: Record<string, any>, role: UserRole) {
    return {
        role,
        stats: d.stats,
        quickActions: d.quickActions,
        myCourses: (d.myCourses || []).map((c: any) => ({
            title: c.title,
            courseId: String(c._id),
            isPublished: Boolean(c.isPublished),
            category: c.category?.name,
        })),
        pendingEnrollmentCount: d.pendingEnrollments?.length ?? 0,
    };
}

/** Compact, JSON-serializable dashboard slice for the LangGraph personal agent (Node → Python). */
export async function buildAgentDashboardContext(
    userId: string,
    role: UserRole
): Promise<Record<string, unknown>> {
    switch (role) {
        case UserRole.STUDENT:
        case UserRole.PREMIUM_STUDENT:
        case UserRole.TRIAL_STUDENT:
            return toStudentAgentContext(await getStudentDashboard(userId), role);
        case UserRole.INSTRUCTOR:
        case UserRole.ASSISTANT_INSTRUCTOR:
        case UserRole.GUEST_INSTRUCTOR:
            return toInstructorAgentContext(await getInstructorDashboard(userId), role);
        case UserRole.SUPER_ADMIN:
        case UserRole.ADMIN: {
            const d = await getAdminDashboard(userId);
            return { role, stats: d.stats, quickActions: d.quickActions };
        }
        case UserRole.MODERATOR: {
            const d = await getModeratorDashboard(userId);
            return { role, stats: d.stats, quickActions: d.quickActions };
        }
        case UserRole.CONTENT_MANAGER: {
            const d = await getContentManagerDashboard(userId);
            return { role, stats: d.stats, quickActions: d.quickActions };
        }
        case UserRole.FINANCE_MANAGER: {
            const d = await getFinanceDashboard(userId);
            return { role, stats: d.stats, quickActions: d.quickActions };
        }
        case UserRole.ANALYST: {
            const d = await getAnalystDashboard(userId);
            return { role, quickActions: d.quickActions };
        }
        case UserRole.REVIEWER: {
            const d = await getReviewerDashboard(userId);
            return { role, stats: d.stats, quickActions: d.quickActions };
        }
        case UserRole.SUPPORT_STAFF: {
            const d = await getSupportDashboard(userId);
            return {
                role,
                quickActions: d.quickActions,
                pendingEnrollmentsCount: d.pendingEnrollments?.length ?? 0,
            };
        }
        default: {
            const d = await getBasicDashboard(userId);
            return { role, userName: d.user?.name, message: d.message };
        }
    }
}
