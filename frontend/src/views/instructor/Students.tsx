import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/navigation';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import axios from 'axios';
import { ArrowLeft, Users, CheckCircle, XCircle, Search } from 'lucide-react';

interface Student {
    studentId: {
        _id: string;
        name: string;
        email: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    enrolledAt: string;
    approvedAt?: string;
}

interface Course {
    _id: string;
    title: string;
    students: Student[];
}

const Students: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/courses/my/created`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Fetch students for each course
            const coursesWithStudents = await Promise.all(
                res.data.map(async (course: Course) => {
                    try {
                        const studentsRes = await axios.get(
                            `${API_URL}/courses/${course._id}/students`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        return { ...course, students: studentsRes.data };
                    } catch (err) {
                        return { ...course, students: [] };
                    }
                })
            );
            
            setCourses(coursesWithStudents);
        } catch (err) {
            console.error('Error fetching courses:', err);
            showError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (courseId: string, studentId: string) => {
        try {
            await axios.patch(
                `${API_URL}/courses/${courseId}/approve/${studentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Student approved successfully');
            fetchCourses();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to approve student');
        }
    };

    const handleReject = async (courseId: string, studentId: string) => {
        try {
            await axios.patch(
                `${API_URL}/courses/${courseId}/reject/${studentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Student rejected');
            fetchCourses();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to reject student');
        }
    };

    const allStudents = courses.flatMap(course =>
        course.students.map(student => ({ ...student, courseTitle: course.title, courseId: course._id }))
    );

    const filteredStudents = allStudents.filter(student => {
        const matchesCourse = selectedCourse === 'all' || student.courseId === selectedCourse;
        const matchesSearch = student.studentId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.studentId.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
        return matchesCourse && matchesSearch && matchesStatus;
    });

    const stats = {
        total: allStudents.length,
        approved: allStudents.filter(s => s.status === 'approved').length,
        pending: allStudents.filter(s => s.status === 'pending').length,
        rejected: allStudents.filter(s => s.status === 'rejected').length
    };

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
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-bg dark:text-white">My Students</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage student enrollments</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-2xl font-bold text-dark-bg dark:text-white">{stats.total}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-2xl font-bold text-emerald-500">{stats.approved}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                        </div>
                        <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary"
                            >
                                <option value="all">All Courses</option>
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>{course.title}</option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-dark-bg dark:text-white focus:outline-none focus:border-primary"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading...</div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">No students found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Student</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Course</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Enrolled</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredStudents.map((student, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-dark-bg dark:text-white">{student.studentId.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.studentId.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-dark-bg dark:text-white">{student.courseTitle}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.status === 'approved' && (
                                                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold rounded-lg">Approved</span>
                                                    )}
                                                    {student.status === 'pending' && (
                                                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold rounded-lg">Pending</span>
                                                    )}
                                                    {student.status === 'rejected' && (
                                                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold rounded-lg">Rejected</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(student.enrolledAt).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {student.status === 'pending' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleApprove(student.courseId, student.studentId._id)}
                                                                className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(student.courseId, student.studentId._id)}
                                                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Students;
