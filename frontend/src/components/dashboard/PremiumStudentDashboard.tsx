import React from 'react';
import { motion } from 'framer-motion';
import { 
    Zap, Award, Trophy, Rocket, Sparkles, 
    Download, Headphones, MessageSquare, Flame, 
    Crown, Diamond, TrendingUp, BookOpen, Target, Clock
} from 'lucide-react';
import { Link } from '@/lib/navigation';

interface PremiumStudentDashboardProps {
    user: any;
    courses: any[];
}

const PremiumStudentDashboard: React.FC<PremiumStudentDashboardProps> = ({ user, courses }) => {
    const xp = (courses?.length || 0) * 500 + 1250; // Premium bonus
    const level = Math.ceil(xp / 1000);
    const streak = 15; // Placeholder for premium streak

    return (
        <div className="space-y-8 p-4 md:p-8 bg-[#0b0f1a] min-h-screen text-white">
            {/* VIP Welcome Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[2.5rem] p-8 md:p-12 overflow-hidden border border-amber-500/30 bg-gradient-to-br from-[#1a1f2e] via-[#0b0f1a] to-[#121625] shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-widest mb-6">
                            <Crown className="w-4 h-4" />
                            Premium Member
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-none italic">
                            Welcome back, <br />
                            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                                {user?.name || 'V.I.P Student'}
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl font-medium">
                            Your premium journey continues. You have <span className="text-white font-bold">4 exclusive rewards</span> waiting to be claimed today.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center group hover:border-amber-500/50 transition-all">
                            <Flame className="w-10 h-10 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-3xl font-black">{streak}</p>
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">Day Streak</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center group hover:border-amber-400/50 transition-all">
                            <Zap className="w-10 h-10 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-3xl font-black">2.5x</p>
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">XP Booster</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column: Learning & Tasks */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Exclusive Resources Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                    <Diamond className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-black italic">Premium Vault</h2>
                            </div>
                            <button className="text-amber-400 font-bold text-sm hover:underline">View All</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { title: 'Exam Cheat Sheets', icon: Download, color: 'text-blue-400', desc: 'Summarized notes for Grade 12 Biology' },
                                { title: 'Priority Career Path', icon: Target, color: 'text-emerald-400', desc: 'Direct mapping to tech internships' },
                                { title: 'VIP Q&A Library', icon: MessageSquare, color: 'text-purple-400', desc: 'Recorded mentor sessions' },
                                { title: 'Code Templates', icon: Rocket, color: 'text-rose-400', desc: 'MERN stack production boilerplates' }
                            ].map((res, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    className="bg-[#1a1f2e] border border-white/5 p-6 rounded-[2rem] flex items-center gap-5 group cursor-pointer"
                                >
                                    <div className={`p-4 rounded-2xl bg-white/5 ${res.color} group-hover:bg-white/10 transition-colors`}>
                                        <res.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-none mb-1">{res.title}</h3>
                                        <p className="text-xs text-gray-500">{res.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Active Courses (Premium View) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-black italic">Continue Sprinting</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {courses && courses.length > 0 ? courses.slice(0, 3).map((c: any, i: number) => (
                                <div key={i} className="bg-[#121625] border border-white/5 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden relative">
                                            {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-8 h-8 text-slate-600 m-4" />}
                                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{c.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 4h left</span>
                                                <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" /> Certificate</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 min-w-[200px]">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-[10px] font-black italic text-gray-500">
                                                <span>PROGRESS</span>
                                                <span className="text-primary">64%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/5">
                                                <div className="h-full w-[64%] bg-gradient-to-r from-primary to-blue-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
                                            </div>
                                        </div>
                                        <Link to={`/student/browse?id=${c._id}`}>
                                            <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
                                                <Rocket className="w-5 h-5" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <p className="text-gray-500">No active courses. Experience the premium library!</p>
                                    <Link to="/student/browse">
                                        <button className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:scale-105 transition-all">Explore Library</button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Status & Assistance */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Level Progress Card */}
                    <div className="bg-[#1a1f2e] border border-amber-500/20 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-widest text-amber-400 italic">Academic Tier</p>
                                <Sparkles className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="text-center py-4">
                                <p className="text-6xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">Lvl {level}</p>
                                <p className="text-sm font-bold text-gray-400 mt-2">Elite Scholar Status</p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-500">{xp} / {level * 1000} XP</span>
                                    <span className="text-amber-500">850 to Next Lvl</span>
                                </div>
                                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '75%' }}
                                        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 rounded-full" 
                                    />
                                </div>
                            </div>
                            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                View Leaderboard
                            </button>
                        </div>
                    </div>

                    {/* Premium Support */}
                    <div className="bg-gradient-to-br from-[#06b6d4] to-blue-600 rounded-[2rem] p-8 shadow-2xl relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <Headphones className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2 italic">Priority Mentor</h3>
                            <p className="text-white/80 text-sm mb-6 leading-relaxed font-medium">
                                Stuck on a concept? Your premium status grants you access to instant AI support and priority human grading.
                            </p>
                            <button className="px-6 py-3 bg-white text-primary font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Priority Assistance
                            </button>
                        </div>
                    </div>

                    {/* Weekly Analytics Mini */}
                    <div className="bg-[#121625] border border-white/5 rounded-[2rem] p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Weekly Momentum
                        </h3>
                        <div className="flex items-end justify-between h-32 gap-2">
                            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 0.8 }}
                                    className={`w-full rounded-t-lg bg-gradient-to-t ${i === 3 ? 'from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'from-primary/20 to-primary/60'}`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-black text-gray-600 uppercase">
                            <span>M</span><span>T</span><span>W</span><span className="text-amber-500">T</span><span>F</span><span>S</span><span>S</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumStudentDashboard;
