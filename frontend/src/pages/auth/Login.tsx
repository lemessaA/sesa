import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
    Mail,
    Lock,
    Loader,
    ArrowRight,
    User,
    Eye,
    EyeOff,
    BookOpen,
    Globe,
    Layers,
    GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../utils/api';
import { SafeImage } from '../../components/ui/SafeImage';
import { HERO_BACKGROUND_IMAGES } from '../../constants/heroBackgrounds';

const POST_AUTH_PATH = '/';

const PAGE_TITLE = 'Sign in — SESA TECHNOLOGY';
const PAGE_DESCRIPTION =
    'SESA TECHNOLOGY — Safe Educational & Skill Academy. Sign in or create a learner account.';

interface LoginProps {
    role?: UserRole;
    title?: string;
}

const Login: React.FC<LoginProps> = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [heroIndex, setHeroIndex] = useState(0);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const prevTitle = document.title;
        const meta = document.querySelector('meta[name="description"]');
        const prevDesc = meta?.getAttribute('content') ?? '';
        document.title = PAGE_TITLE;
        if (meta) meta.setAttribute('content', PAGE_DESCRIPTION);
        return () => {
            document.title = prevTitle;
            if (meta) meta.setAttribute('content', prevDesc);
        };
    }, []);

    useEffect(() => {
        const id = window.setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % HERO_BACKGROUND_IMAGES.length);
        }, 4000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(POST_AUTH_PATH, { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (isRegister && name.trim().length < 2) {
            setError('Name must be at least 2 characters.');
            setIsLoading(false);
            return;
        }

        if (isRegister && password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (isRegister && (password.length < 8 || !/\d/.test(password))) {
            setError('Password must be at least 8 characters and include at least one number.');
            setIsLoading(false);
            return;
        }

        try {
            if (isRegister) {
                const response = await apiService.auth.register({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role: UserRole.STUDENT,
                });

                login(response.data.token, response.data.user);
                navigate(POST_AUTH_PATH, { replace: true });
                return;
            }

            const response = await apiService.auth.login(email.trim(), password);
            login(response.data.token, response.data.user);
            navigate(POST_AUTH_PATH, { replace: true });
        } catch (err: unknown) {
            console.error('[Login] Error:', err);
            const axiosErr = err as { response?: { data?: { message?: string; errors?: { msg?: string }[] } } };
            const msg =
                axiosErr.response?.data?.message ||
                axiosErr.response?.data?.errors?.[0]?.msg ||
                'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
            {/* Rotating hero backgrounds (same set as landing) */}
            <AnimatePresence initial={false} mode="sync">
                <motion.div
                    key={heroIndex}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                >
                    <SafeImage
                        src={HERO_BACKGROUND_IMAGES[heroIndex]}
                        alt="SESA Academy"
                        className="w-full h-full object-cover brightness-95 saturate-110"
                        wrapperClassName="absolute inset-0"
                        fallback={
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                                <GraduationCap className="h-24 w-24 text-white/30" />
                            </div>
                        }
                    />
                </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/88 via-[#0b1f4d]/72 to-[#030712]/86" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/60" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />

            <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="overflow-hidden rounded-3xl border border-white/25 bg-white/12 shadow-2xl shadow-black/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
                    <div className="h-1.5 bg-gradient-to-r from-[#2563eb] via-cyan-400 to-[#1e40af]" />

                    <div className="p-8">
                        <div className="mb-8 text-center">
                            <img
                                src="/sesa-technology-logo.png"
                                alt="SESA Technology"
                                className="mx-auto h-auto max-h-28 w-auto max-w-[min(100%,280px)] object-contain drop-shadow-lg"
                            />
                            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900 dark:text-white md:text-2xl">
                                SESA Technology
                            </h2>
                            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-sm">
                                Safe Educational &amp; Skill Academy
                            </p>
                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                                {isRegister
                                    ? 'Create your account to start learning.'
                                    : 'Sign in with email and password to access the platform.'}
                            </p>
                        </div>

                        <div className="mb-6 flex rounded-xl border border-white/20 bg-white/10 p-1 dark:bg-black/20">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-300 ${
                                    !isRegister
                                        ? 'bg-white text-slate-900 shadow-md dark:bg-white dark:text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(true);
                                    setError('');
                                    setSuccess('');
                                }}
                                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-300 ${
                                    isRegister
                                        ? 'bg-white text-slate-900 shadow-md dark:bg-white dark:text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                Register
                            </button>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-4 rounded-xl border border-red-200/50 bg-red-50/90 p-3 text-sm font-medium text-red-700 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300"
                                >
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-4 rounded-xl border border-emerald-200/50 bg-emerald-50/90 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                >
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence>
                                {isRegister && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-1.5 overflow-hidden"
                                    >
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Full name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                required={isRegister}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full rounded-xl border border-white/30 bg-white/80 py-3 pl-10 pr-4 text-slate-900 outline-none ring-cyan-500/30 transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 dark:border-white/10 dark:bg-slate-800/80 dark:text-white"
                                                placeholder="Your name"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-white/30 bg-white/80 py-3 pl-10 pr-4 text-slate-900 outline-none ring-cyan-500/30 transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 dark:border-white/10 dark:bg-slate-800/80 dark:text-white"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-white/30 bg-white/80 py-3 pl-10 pr-12 text-slate-900 outline-none ring-cyan-500/30 transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 dark:border-white/10 dark:bg-slate-800/80 dark:text-white"
                                        placeholder={isRegister ? '8+ chars, include a number' : 'Your password'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isRegister && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-1.5 overflow-hidden"
                                    >
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                            Confirm password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required={isRegister}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full rounded-xl border border-white/30 bg-white/80 py-3 pl-10 pr-4 text-slate-900 outline-none ring-cyan-500/30 transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 dark:border-white/10 dark:bg-slate-800/80 dark:text-white"
                                                placeholder="Re-enter password"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>{isRegister ? 'Create account' : 'Login'}</span>
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-3 dark:bg-black/20">
                            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-500" />
                                <span>
                                    New accounts register as learners. Staff accounts use the same sign-in with their
                                    organization email.
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                                10,000+ Students
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                                50+ Courses
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                                Expert teachers
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
