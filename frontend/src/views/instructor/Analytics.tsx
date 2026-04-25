import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/navigation';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, BarChart3, Users, BookOpen, TrendingUp, Clock, Award } from 'lucide-react';

interface Stats {
    totalCourses: number;
    totalStudents: number;
    pendingEnrollments: number;
    averageRating: number;
}

const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalCourses: 0,
        totalStudents: 0,
        pendingEnrollments: 0,
        averageRating: 0
    });
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/users/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const statsData = [
        { icon: BookOpen, label: 'Total Courses', value: stats.totalCourses, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: Users, label: 'Total Students', value: stats.totalStudents, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: Clock, label: 'Pending Enrollments', value: stats.pendingEnrollments, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { icon: TrendingUp, label: 'Average Rating', value: stats.averageRating.toFixed(1), color: 'text-rose-500', bg: 'bg-rose-500/10' }
    ];

    return (
        <div className="min-h-[85vh] bg-gray-50 dark:bg-dark-bg p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-bg dark:text-white">Course Analytics</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Track your teaching performance</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                                {statsData.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all"
                                    >
                                        <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <p className="text-2xl md:text-3xl font-black text-dark-bg dark:text-white">{stat.value}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Performance Overview */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Engagement */}
                                <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                                    <h3 className="font-bold text-dark-bg dark:text-white mb-4">Student Engagement</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Active Students</span>
                                                <span className="text-sm font-bold text-dark-bg dark:text-white">
                                                    {stats.totalStudents > 0 ? Math.round((stats.totalStudents / (stats.totalStudents + stats.pendingEnrollments)) * 100) : 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="h-2 bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                                                    style={{ width: `${stats.totalStudents > 0 ? Math.round((stats.totalStudents / (stats.totalStudents + stats.pendingEnrollments)) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Course Completion</span>
                                                <span className="text-sm font-bold text-dark-bg dark:text-white">75%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: '75%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Average Progress</span>
                                                <span className="text-sm font-bold text-dark-bg dark:text-white">62%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: '62%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                                    <h3 className="font-bold text-dark-bg dark:text-white mb-4">Recent Activity</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                                <Users className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-dark-bg dark:text-white">New enrollment</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                <Award className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-dark-bg dark:text-white">Course completed</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-dark-bg dark:text-white">Rating received</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Message */}
                            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    📊 More detailed analytics including charts, graphs, and student progress tracking will be available soon.
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Analytics;
