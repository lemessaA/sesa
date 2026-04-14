import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import {
    ArrowLeft,
    BookOpen,
    Check,
    Edit3,
    GraduationCap,
    Megaphone,
    RefreshCw,
    Search,
    Send,
    Shield,
    Trash2,
    UserCog,
    X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type ApiUserRole = 'student' | 'instructor' | 'admin' | 'super_admin';
type UiUserRole = 'student' | 'teacher' | 'admin';

interface UserRecord {
    _id: string;
    name: string;
    email: string;
    role: ApiUserRole;
    createdAt: string;
}

interface AdminCourseRecord {
    _id: string;
    title: string;
}

interface PendingEnrollment {
    student: {
        _id: string;
        name: string;
        email: string;
        role: ApiUserRole;
    };
    requestedAt?: string;
    courseId: string;
    courseTitle: string;
}

interface AnnouncementRecord {
    _id: string;
    message: string;
    targetRole: 'student' | 'instructor' | 'both';
    isActive: boolean;
    createdAt: string;
}

interface AdminDashboardResponse {
    role: string;
    users: UserRecord[];
    courses: AdminCourseRecord[];
    pendingQueue: PendingEnrollment[];
}

const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.03, duration: 0.25, ease: 'easeOut' as const },
    }),
};

const toUiRole = (role: ApiUserRole): UiUserRole => {
    if (role === 'instructor') return 'teacher';
    if (role === 'super_admin') return 'admin';
    return role;
};

const roleIcon = (role: UiUserRole): React.ReactNode => {
    if (role === 'admin') return <Shield className="h-3.5 w-3.5" />;
    if (role === 'teacher') return <GraduationCap className="h-3.5 w-3.5" />;
    return <BookOpen className="h-3.5 w-3.5" />;
};

const roleBadgeClass = (role: UiUserRole): string => {
    if (role === 'admin') return 'bg-blue-500/20 text-blue-200 border border-blue-400/40';
    if (role === 'teacher') return 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40';
    return 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40';
};

const ManageUsers: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [users, setUsers] = useState<UserRecord[]>([]);
    const [pendingQueue, setPendingQueue] = useState<PendingEnrollment[]>([]);
    const [search, setSearch] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingQueue, setIsLoadingQueue] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [queueActionKey, setQueueActionKey] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcementTargetRole, setAnnouncementTargetRole] = useState<'student' | 'instructor' | 'both'>('both');
    const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
    const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ message: '', targetRole: 'both' as 'student' | 'instructor' | 'both' });

    const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const fetchDashboardData = async (): Promise<void> => {
        try {
            setIsLoadingUsers(true);
            setIsLoadingQueue(true);
            const response = await axios.get<AdminDashboardResponse>(`${API_URL}/users/dashboard-data`, {
                headers: authHeaders,
            });
            setUsers(response.data.users ?? []);
            setPendingQueue(response.data.pendingQueue ?? []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoadingUsers(false);
            setIsLoadingQueue(false);
        }
    };

    const fetchAnnouncements = async (): Promise<void> => {
        try {
            setIsLoadingAnnouncements(true);
            const response = await axios.get<AnnouncementRecord[]>(`${API_URL}/announcements?scope=all`, {
                headers: authHeaders,
            });
            setAnnouncements(response.data ?? []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load announcements');
        } finally {
            setIsLoadingAnnouncements(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchAnnouncements();
    }, [token]);

    const handleRoleChange = async (user: UserRecord, nextRole: UiUserRole): Promise<void> => {
        const currentUiRole = toUiRole(user.role);
        if (currentUiRole === nextRole) return;

        try {
            setUpdatingUserId(user._id);
            await axios.put(
                `${API_URL}/users/change-role`,
                { userId: user._id, role: nextRole },
                { headers: authHeaders }
            );

            setUsers((prev) =>
                prev.map((entry) =>
                    entry._id === user._id
                        ? { ...entry, role: nextRole === 'teacher' ? 'instructor' : (nextRole as ApiUserRole) }
                        : entry
                )
            );

            toast.success('Role Updated Successfully');
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to update role');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleApprove = async (entry: PendingEnrollment): Promise<void> => {
        const key = `${entry.courseId}:${entry.student._id}:approve`;

        try {
            setQueueActionKey(key);
            await axios.put(
                `${API_URL}/admin/approve-enrollment`,
                { courseId: entry.courseId, studentId: entry.student._id },
                { headers: authHeaders }
            );

            setPendingQueue((prev) =>
                prev.filter(
                    (item) => !(item.courseId === entry.courseId && item.student._id === entry.student._id)
                )
            );

            toast.success('Enrollment approved');
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to approve enrollment');
        } finally {
            setQueueActionKey(null);
        }
    };

    const handleReject = async (entry: PendingEnrollment): Promise<void> => {
        const key = `${entry.courseId}:${entry.student._id}:reject`;

        try {
            setQueueActionKey(key);
            await axios.put(
                `${API_URL}/courses/reject`,
                { courseId: entry.courseId, studentId: entry.student._id },
                { headers: authHeaders }
            );

            setPendingQueue((prev) =>
                prev.filter(
                    (item) => !(item.courseId === entry.courseId && item.student._id === entry.student._id)
                )
            );

            toast.success('Enrollment rejected');
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to reject enrollment');
        } finally {
            setQueueActionKey(null);
        }
    };

    const handleCreateAnnouncement = async (): Promise<void> => {
        const message = announcementMessage.trim();
        if (!message) {
            toast.error('Announcement message is required');
            return;
        }

        try {
            setIsCreatingAnnouncement(true);
            await axios.post(
                `${API_URL}/announcements`,
                {
                    message,
                    targetRole: announcementTargetRole,
                },
                { headers: authHeaders }
            );

            setAnnouncementMessage('');
            toast.success('Announcement created');
            fetchAnnouncements();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to create announcement');
        } finally {
            setIsCreatingAnnouncement(false);
        }
    };

    const handleEditAnnouncement = async (id: string): Promise<void> => {
        try {
            await axios.put(
                `${API_URL}/announcements/${id}`,
                editForm,
                { headers: authHeaders }
            );
            toast.success('Announcement updated successfully');
            setEditingAnnouncement(null);
            fetchAnnouncements();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update announcement');
        }
    };

    const handleDeleteAnnouncement = async (id: string, message: string): Promise<void> => {
        if (!window.confirm(`Are you sure you want to delete this announcement: "${message.substring(0, 50)}..."?`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/announcements/${id}`, {
                headers: authHeaders
            });
            toast.success('Announcement deleted successfully');
            fetchAnnouncements();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to delete announcement');
        }
    };

    const startEdit = (announcement: AnnouncementRecord): void => {
        setEditingAnnouncement(announcement._id);
        setEditForm({
            message: announcement.message,
            targetRole: announcement.targetRole
        });
    };

    const cancelEdit = (): void => {
        setEditingAnnouncement(null);
        setEditForm({ message: '', targetRole: 'both' });
    };

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return users;

        return users.filter((user) => {
            return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
        });
    }, [users, search]);

    return (
        <div className="min-h-[85vh] p-4 md:p-8" style={{ backgroundColor: '#0a192f' }}>
            <Toaster position="top-right" />

            <div className="mx-auto max-w-7xl space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#112240] px-3 py-2 text-sm text-slate-200 transition-colors hover:border-blue-400/50 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>

                    <div className="rounded-2xl border border-slate-700 bg-[#112240] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Navy Excellence User Management</h1>
                                <p className="text-sm text-slate-300">
                                    Manage roles instantly and process the approval queue in real time.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    fetchDashboardData();
                                    fetchAnnouncements();
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/25"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-700 bg-[#112240] p-5"
                >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-white">
                            <UserCog className="h-5 w-5 text-blue-300" />
                            Users
                        </h2>

                        <div className="relative w-full max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email"
                                className="w-full rounded-xl border border-slate-600 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wide text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingUsers ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-slate-300" colSpan={4}>
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-slate-300" colSpan={4}>
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user, index) => {
                                        const uiRole = toUiRole(user.role);
                                        return (
                                            <motion.tr
                                                key={user._id}
                                                custom={index}
                                                variants={rowVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="border-t border-slate-800 text-slate-100 hover:bg-slate-900/35"
                                            >
                                                <td className="px-4 py-3">
                                                    <span className="font-medium">{user.name}</span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${roleBadgeClass(uiRole)}`}>
                                                            {roleIcon(uiRole)}
                                                            {uiRole}
                                                        </span>
                                                        <select
                                                            value={uiRole}
                                                            disabled={updatingUserId === user._id}
                                                            onChange={(event) =>
                                                                handleRoleChange(user, event.target.value as UiUserRole)
                                                            }
                                                            className="rounded-lg border border-slate-600 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 focus:border-blue-400 focus:outline-none"
                                                        >
                                                            <option value="student">Student</option>
                                                            <option value="teacher">Teacher</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-700 bg-[#112240] p-5"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Approval Queue</h2>
                        <span className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-100">
                            {pendingQueue.length} pending
                        </span>
                    </div>

                    {isLoadingQueue ? (
                        <p className="rounded-xl border border-slate-700 bg-slate-900/45 px-4 py-6 text-center text-sm text-slate-300">
                            Loading approval queue...
                        </p>
                    ) : pendingQueue.length === 0 ? (
                        <p className="rounded-xl border border-slate-700 bg-slate-900/45 px-4 py-6 text-center text-sm text-slate-300">
                            Queue is clear. No students waiting for approval.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {pendingQueue.map((entry, index) => {
                                const approveKey = `${entry.courseId}:${entry.student._id}:approve`;
                                const rejectKey = `${entry.courseId}:${entry.student._id}:reject`;
                                return (
                                    <motion.div
                                        key={`${entry.courseId}-${entry.student._id}`}
                                        custom={index}
                                        variants={rowVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="rounded-xl border border-slate-700 bg-slate-900/45 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-white">{entry.student.name}</p>
                                                <p className="text-xs text-slate-300">{entry.student.email}</p>
                                                <p className="mt-1 text-xs text-blue-200">
                                                    Waiting for: <span className="font-semibold">{entry.courseTitle}</span>
                                                </p>
                                                {entry.requestedAt && (
                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        Requested: {new Date(entry.requestedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(entry)}
                                                    disabled={queueActionKey === approveKey || queueActionKey === rejectKey}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(entry)}
                                                    disabled={queueActionKey === approveKey || queueActionKey === rejectKey}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-700 bg-[#112240] p-5"
                >
                    <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-white">
                        <Megaphone className="h-5 w-5 text-blue-300" />
                        Announcement Creator
                    </h2>

                    <div className="grid gap-3 md:grid-cols-12">
                        <input
                            value={announcementMessage}
                            onChange={(event) => setAnnouncementMessage(event.target.value)}
                            placeholder="Type announcement message..."
                            className="md:col-span-8 rounded-xl border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                        />
                        <select
                            value={announcementTargetRole}
                            onChange={(event) =>
                                setAnnouncementTargetRole(event.target.value as 'student' | 'instructor' | 'both')
                            }
                            className="md:col-span-2 rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-blue-400 focus:outline-none"
                        >
                            <option value="student">Students</option>
                            <option value="instructor">Instructors</option>
                            <option value="both">All</option>
                        </select>
                        <button
                            onClick={handleCreateAnnouncement}
                            disabled={isCreatingAnnouncement}
                            className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/30 disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {isCreatingAnnouncement ? 'Sending...' : 'Publish'}
                        </button>
                    </div>

                    <div className="mt-4 space-y-2">
                        {isLoadingAnnouncements ? (
                            <p className="text-sm text-slate-300">Loading announcements...</p>
                        ) : announcements.length === 0 ? (
                            <p className="text-sm text-slate-300">No announcements yet.</p>
                        ) : (
                            announcements.slice(0, 6).map((announcement) => (
                                <div
                                    key={announcement._id}
                                    className="rounded-xl border border-slate-700 bg-slate-900/45 px-3 py-2"
                                >
                                    {editingAnnouncement === announcement._id ? (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <select
                                                    value={editForm.targetRole}
                                                    onChange={(e) => setEditForm({ ...editForm, targetRole: e.target.value as any })}
                                                    className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 focus:border-blue-400 focus:outline-none"
                                                >
                                                    <option value="both">Everyone</option>
                                                    <option value="student">Students</option>
                                                    <option value="instructor">Instructors</option>
                                                </select>
                                                <button
                                                    onClick={() => handleEditAnnouncement(announcement._id)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                    Cancel
                                                </button>
                                            </div>
                                            <textarea
                                                value={editForm.message}
                                                onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                                                rows={2}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:border-blue-400 focus:outline-none resize-none"
                                                placeholder="Enter announcement message..."
                                            />
                                        </div>
                                    ) : (
                                        // View Mode
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-sm text-white">{announcement.message}</p>
                                                <p className="mt-1 text-[11px] text-slate-300">
                                                    Target: {announcement.targetRole} • {new Date(announcement.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => startEdit(announcement)}
                                                    className="p-1 text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                                                    title="Edit announcement"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAnnouncement(announcement._id, announcement.message)}
                                                    className="p-1 text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                    title="Delete announcement"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default ManageUsers;
