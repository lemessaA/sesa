import React from 'react';
import { motion } from 'framer-motion';
import { 
    BookOpen, Users, Plus, 
    TrendingUp, Clock, HelpCircle 
} from 'lucide-react';
import { Link } from '@/lib/navigation';

interface AssistantDashboardProps {
    data: any;
}

const AssistantDashboard: React.FC<AssistantDashboardProps> = ({ data }) => {
    const stats = [
        { label: 'Courses Assisting', value: data.stats?.totalCourses || 0, icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'Total Students', value: data.stats?.totalEnrollments || 0, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Student Questions', value: data.recentComments?.length || 0, icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Users className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-bg dark:text-white">Assistant Instructor Portal</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Supporting lead instructors and managing student progress.</p>
                    </div>
                    <Link to="/instructor/create-course">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Topic
                        </motion.button>
                    </Link>
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

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Active Courses */}
                <section className="lg:col-span-8 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-dark-bg dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Active Courses
                        </h2>
                    </div>
                    <div className="p-0">
                        {data.myCourses?.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {data.myCourses.map((course: any) => (
                                    <div key={course._id} className="p-6 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-dark-bg dark:text-white">{course.title}</h3>
                                                <p className="text-xs text-gray-500">{course.category?.name || 'General'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Students</p>
                                                <p className="text-sm font-bold text-dark-bg dark:text-white">{course.enrolledStudents?.length || 0}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    course.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                    {course.status}
                                                </span>
                                            </div>
                                            <Link to={`/instructor/edit/${course._id}`} className="p-2 text-gray-400 hover:text-primary transition-colors">
                                                <Plus className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                No courses assigned yet.
                            </div>
                        )}
                    </div>
                </section>

                {/* Sidebar Activity */}
                <aside className="lg:col-span-4 space-y-6">
                    <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Recent Help
                        </h2>
                        <div className="space-y-4">
                            {data.recentComments?.length > 0 ? (
                                data.recentComments.slice(0, 4).map((c: any, i: number) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {c.comments[0]?.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-dark-bg dark:text-white">{c.comments[0]?.userName}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">"{c.comments[0]?.text}"</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500">No new discussion activity.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-5 h-5" />
                            <h2 className="font-bold">Growth Tip</h2>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                            Engage with students in the discussion forum to increase course satisfaction and completion rates by up to 25%.
                        </p>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default AssistantDashboard;
