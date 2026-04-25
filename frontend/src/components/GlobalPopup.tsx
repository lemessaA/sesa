import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { Link } from '@/lib/navigation';

const GlobalPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenPopup = localStorage.getItem('sesa_popup_seen');
        if (!hasSeenPopup) {
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const closePopup = () => {
        setIsOpen(false);
        localStorage.setItem('sesa_popup_seen', 'true');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#112240] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/10"
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-gradient-to-r from-cyan-600 to-blue-700 flex items-center justify-center relative">
                            <div className="absolute top-4 right-4 text-white/50">
                                <Bell className="w-20 h-20 rotate-12 opacity-20" />
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                                <Bell className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome to SESA Academy 🌍</h2>
                            <p className="text-slate-300 mb-6 leading-relaxed">
                                Our platform is now fully synchronized. Enroll in courses, track your progress in real-time, and join our active discussion sections!
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/faq" onClick={closePopup}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors border border-slate-700"
                                    >
                                        Learn More
                                    </motion.button>
                                </Link>
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(34, 211, 238, 0.25)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={closePopup}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/40"
                                >
                                    Get Started
                                </motion.button>
                            </div>
                        </div>

                        {/* Close Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={closePopup}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GlobalPopup;
