import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from '@/lib/navigation';
import { Home, ArrowLeft, Search, GraduationCap, Map, Sparkles } from 'lucide-react';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px]"
                />
            </div>

            <div className="max-w-3xl w-full relative z-10 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="mb-8"
                >
                    <div className="relative inline-block">
                        <h1 className="text-[150px] md:text-[200px] font-black leading-none bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent opacity-20 select-none">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <GraduationCap className="w-24 h-24 md:w-32 md:h-32 text-primary drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-3xl md:text-5xl font-black text-dark-bg dark:text-white mb-4 italic">
                        Class Dismissed?
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                        It seems you've wandered into an uncharted area of <span className="text-primary font-bold tracking-tight">SESA Academy</span>. Even the best students get lost sometimes.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Go Back
                        </motion.button>
                        
                        <Link to="/">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(6,182,212,0.25)" }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-xl transition-all"
                            >
                                <Home className="w-5 h-5" />
                                Return Home
                            </motion.button>
                        </Link>
                    </div>

                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: Map, label: 'Marketplace', to: '/marketplace' },
                            { icon: Search, label: 'Search Courses', to: '/student/browse' },
                            { icon: GraduationCap, label: 'Login', to: '/auth' }
                        ].map((item, i) => (
                            <Link key={i} to={item.to}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center"
                                >
                                    <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                    <span className="text-sm font-bold text-dark-bg dark:text-white">{item.label}</span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Floating decorative elements */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: [0, Math.random() * -100, 0],
                        x: [0, Math.random() * 50, 0],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 2
                    }}
                    className="absolute hidden md:block text-primary/20 pointer-events-none"
                    style={{
                        top: `${Math.random() * 80}%`,
                        left: `${Math.random() * 90}%`,
                    }}
                >
                    <Sparkles className="w-8 h-8" />
                </motion.div>
            ))}
        </div>
    );
};

export default NotFound;
