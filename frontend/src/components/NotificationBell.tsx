import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Trash2, ExternalLink, BookOpen, CreditCard, GraduationCap, Megaphone, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: { page: number; total: number; pages: number };
}

const typeIconMap: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
    enrollment_approved: { icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    enrollment_rejected: { icon: X, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
    enrollment_pending: { icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    course_published: { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    course_approved: { icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    course_rejected: { icon: X, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
    payment_verified: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    payment_rejected: { icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
    announcement: { icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    system: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-700/40' },
};

const timeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const NotificationBell: React.FC = () => {
    const { user, token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const headers = { Authorization: `Bearer ${token}` };

    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const { data } = await axios.get<{ unreadCount: number }>(
                `${API_URL}/notifications/unread-count`, { headers }
            );
            setUnreadCount(data.unreadCount);
        } catch { /* silent */ }
    }, [token, API_URL]);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const { data } = await axios.get<NotificationResponse>(
                `${API_URL}/notifications?limit=15`, { headers }
            );
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [token, API_URL]);

    // Poll every 30s for unread count
    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const id = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(id);
    }, [fetchUnreadCount, user]);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(v => !v);
        if (!isOpen) fetchNotifications();
    };

    const markRead = async (id: string) => {
        try {
            await axios.patch(`${API_URL}/notifications/${id}/read`, {}, { headers });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await axios.patch(`${API_URL}/notifications/read-all`, {}, { headers });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const clearRead = async () => {
        try {
            await axios.delete(`${API_URL}/notifications`, { headers });
            setNotifications(prev => prev.filter(n => !n.isRead));
        } catch { /* silent */ }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-16px)] bg-white dark:bg-[#0f2240] rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                <h3 className="font-bold text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">{unreadCount} new</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                                        title="Mark all read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={clearRead}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                                    title="Clear read"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {!loading && notifications.length === 0 && (
                                <div className="py-10 text-center">
                                    <Bell className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">We'll notify you about important updates</p>
                                </div>
                            )}
                            {!loading && notifications.map((n, idx) => {
                                const iconDef = typeIconMap[n.type] ?? typeIconMap.system;
                                const IconComp = iconDef.icon;
                                return (
                                    <motion.div
                                        key={n._id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        onClick={() => !n.isRead && markRead(n._id)}
                                        className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 ${
                                            n.isRead
                                                ? 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                                                : 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                                        }`}
                                    >
                                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${iconDef.bg} flex items-center justify-center mt-0.5`}>
                                            <IconComp className={`w-4 h-4 ${iconDef.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold leading-tight ${n.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-800 dark:text-white'}`}>
                                                    {n.title}
                                                </p>
                                                {!n.isRead && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</span>
                                                {n.link && (
                                                    <a
                                                        href={n.link}
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                                                    >
                                                        View <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
