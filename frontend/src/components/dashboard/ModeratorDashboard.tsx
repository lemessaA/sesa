import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, BookOpen, MessageSquare, CheckCircle, XCircle, 
    Eye, Shield, AlertCircle 
} from 'lucide-react';
import { Link } from '@/lib/navigation';

interface ModeratorDashboardProps {
    data: any;
    onAction: (type: string, id: string, action: string) => void;
}

const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({ data, onAction }) => {
    const stats = [
        { label: 'Pending Enrollments', value: data.stats?.pendingEnrollments || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Pending Courses', value: data.stats?.pendingCourses || 0, icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Admin Alerts', value: 0, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Shield className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-dark-bg dark:text-white">Moderator Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review pending requests and maintain platform quality.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm"
                    >
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold text-dark-bg dark:text-white mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Pending Enrollments Section */}
                <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-dark-bg dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Enrollment Requests
                        </h2>
                        <Link to="/admin/enrollments" className="text-sm text-primary font-bold hover:underline">View All</Link>
                    </div>
                    <div className="p-0">
                        {data.pendingEnrollments?.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {data.pendingEnrollments.map((req: any) => (
                                    <div key={req._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                                                {req.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-dark-bg dark:text-white text-sm">{req.user.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{req.course?.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => onAction('enrollment', req._id, 'approve')}
                                                className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                title="Approve"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => onAction('enrollment', req._id, 'reject')}
                                                className="p-2 bg-rose-500/10 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                title="Reject"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">No pending enrollments</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Pending Course Reviews */}
                <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h2 className="text-lg font-bold text-dark-bg dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-amber-500" />
                            Course Reviews
                        </h2>
                    </div>
                    <div className="p-0">
                        {data.pendingCourses?.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {data.pendingCourses.map((course: any) => (
                                    <div key={course._id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-dark-bg dark:text-white text-sm">{course.title}</p>
                                                <p className="text-xs text-gray-400">by {course.instructor?.name}</p>
                                            </div>
                                        </div>
                                        <Link 
                                            to={`/admin/courses/${course._id}/preview`}
                                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Review
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">No courses pending review</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Recent Comments Moderation */}
            <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:divide-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h2 className="text-lg font-bold text-dark-bg dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-500" />
                        Recent Comments
                    </h2>
                </div>
                <div className="p-0">
                    {data.recentComments?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Comment</th>
                                        <th className="px-6 py-3">Course</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {data.recentComments.flatMap((c: any) => c.comments.map((comm: any) => ({ ...comm, courseTitle: c.title, courseId: c._id }))).slice(0, 5).map((comm: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-dark-bg dark:text-white">{comm.userName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{comm.text}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-primary font-medium">{comm.courseTitle}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => onAction('comment', comm._id, 'delete')}
                                                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                                                    title="Remove Comment"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No recent comments to moderate</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ModeratorDashboard;
