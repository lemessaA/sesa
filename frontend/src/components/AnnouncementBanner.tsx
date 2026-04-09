import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type TargetRole = 'student' | 'instructor' | 'both';

interface Announcement {
    _id: string;
    message: string;
    targetRole: TargetRole;
    createdAt: string;
}

interface AnnouncementBannerProps {
    mode?: 'marquee' | 'cards' | 'bell';
    audience?: 'student' | 'instructor' | 'both';
    title?: string;
}

const isNewAnnouncement = (createdAt: string): boolean => {
    const createdMs = new Date(createdAt).getTime();
    if (!Number.isFinite(createdMs)) return false;
    return Date.now() - createdMs < 24 * 60 * 60 * 1000;
};

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
    mode = 'marquee',
    audience = 'both',
    title = 'Announcements',
}) => {
    const { token, isAuthenticated } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [open, setOpen] = useState(false);


    useEffect(() => {
        if (!token) {
            setAnnouncements([]);
            return;
        }

        let isMounted = true;

        const fetchAnnouncements = async (): Promise<void> => {
            try {
                const response = await apiService.announcements.getAll();

                if (isMounted) {
                    setAnnouncements(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                // Silently fail — banner is non-critical
                if (isMounted) {
                    setAnnouncements([]);
                }
            }
        };

        fetchAnnouncements();
        // Poll every 15s so broadcast announcements appear quickly after admin sends them
        const interval = window.setInterval(fetchAnnouncements, 15_000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [token]);

    const visibleAnnouncements = useMemo(() => {
        return announcements.filter((item) => {
            if (audience === 'both') return true;
            return item.targetRole === 'both' || item.targetRole === audience;
        });
    }, [announcements, audience]);

    const marqueeText = useMemo(() => {
        if (visibleAnnouncements.length === 0) return '';
        return visibleAnnouncements.map((item) => item.message).join('   •   ');
    }, [visibleAnnouncements]);

    if (!isAuthenticated || visibleAnnouncements.length === 0) {
        return null;
    }

    if (mode === 'bell') {
        const newCount = visibleAnnouncements.filter((item) => isNewAnnouncement(item.createdAt)).length;
        return (
            <div className="relative">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="relative inline-flex items-center justify-center rounded-xl border border-[#1d3f7a] bg-[#0a1630] p-2 text-[#60a5fa] transition hover:border-[#3b82f6] hover:text-white"
                    title={title}
                >
                    <Bell className="h-5 w-5" />
                    {newCount > 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-[#3b82f6] px-1.5 py-0.5 text-[10px] font-black text-white">
                            {newCount}
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            className="absolute right-0 z-50 mt-3 w-[20rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#1d3f7a] bg-[#0a1630] shadow-2xl"
                        >
                            <div className="flex items-center gap-2 border-b border-[#14305f] px-4 py-3">
                                <Megaphone className="h-4 w-4 text-[#60a5fa]" />
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-100">{title}</p>
                            </div>
                            <div className="max-h-80 space-y-2 overflow-auto p-3">
                                {visibleAnnouncements.slice(0, 8).map((item) => (
                                    <article key={item._id} className="rounded-xl border border-[#14305f] bg-[#050b17] p-3">
                                        <div className="mb-1 flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                                {item.targetRole === 'both' ? 'Broadcast' : item.targetRole}
                                            </span>
                                            {isNewAnnouncement(item.createdAt) && (
                                                <span className="rounded-full border border-[#3b82f6] bg-[#3b82f6] px-2 py-0.5 text-[10px] font-black text-white">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-100">{item.message}</p>
                                    </article>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (mode === 'cards') {
        const latest = visibleAnnouncements[0];
        return (
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.75rem] border border-[#14305f] bg-[#0a1630] shadow-2xl"
            >
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex w-full items-center gap-2 border-b border-[#14305f] px-5 py-4 text-left"
                    aria-expanded={open}
                    aria-label={`Toggle ${title}`}
                >
                    <span className="h-7 w-1.5 rounded-full bg-[#3b82f6]" />
                    <Megaphone className="h-4 w-4 text-[#60a5fa]" />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">{title}</h3>
                        {latest && (
                            <p className="mt-1 truncate text-[11px] text-slate-400">
                                {latest.message}
                            </p>
                        )}
                    </div>
                    <span className="rounded-full border border-[#1d3f7a] bg-[#050b17] px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {visibleAnnouncements.length}
                    </span>
                    <ChevronDown
                        className={`h-4 w-4 text-[#60a5fa] transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden"
                        >
                            <div className="max-h-80 space-y-3 overflow-auto p-4">
                                {visibleAnnouncements.slice(0, 5).map((item, index) => (
                                    <motion.article
                                        key={item._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="rounded-2xl border border-[#14305f] bg-[#050b17] p-4"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                                {item.targetRole === 'both' ? 'Broadcast' : item.targetRole}
                                            </span>
                                            {isNewAnnouncement(item.createdAt) && (
                                                <span className="rounded-full border border-[#3b82f6] bg-[#3b82f6] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-100">{item.message}</p>
                                    </motion.article>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>
        );
    }

    return (
        <div className="border-b border-slate-700/80 bg-[#0a192f]">
            <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-2 text-slate-100 sm:px-6 lg:px-8">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/45 bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
                    <Megaphone className="h-3 w-3" />
                    {title}
                </span>

                <div className="relative w-full overflow-hidden">
                    <motion.div
                        className="whitespace-nowrap text-sm text-slate-200"
                        initial={{ x: '0%' }}
                        animate={{ x: ['0%', '-100%'] }}
                        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                    >
                        {marqueeText}   •   {marqueeText}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBanner;
