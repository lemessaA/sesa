import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiZap, FiUser } from 'react-icons/fi';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    profileImage?: string;
    totalPoints: number;
    level: number;
    streak: number;
}

const Leaderboard: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/gamification/leaderboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setLeaderboard(data);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <header className="mb-10 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block p-3 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-4"
                >
                    <FiAward className="text-4xl text-primary-600 dark:text-primary-400" />
                </motion.div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white italic mb-2">Platform <span className="text-primary-600">Leaderboard</span></h1>
                <p className="text-gray-500 dark:text-gray-400">Compete with fellow learners and rise to the top!</p>
            </header>

            {/* Top 3 Podium (Optional but cool) */}
            <div className="grid grid-cols-3 gap-4 mb-12 items-end">
                {leaderboard.slice(0, 3).map((entry, idx) => {
                    const order = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                    const height = idx === 0 ? 'h-48' : idx === 1 ? 'h-36' : 'h-28';
                    const colors = idx === 0 ? 'from-yellow-400 to-yellow-600' : idx === 1 ? 'from-gray-300 to-gray-500' : 'from-orange-400 to-orange-600';
                    
                    return (
                        <motion.div 
                            key={entry.userId}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex flex-col items-center order-${order}`}
                        >
                            <div className="relative mb-4">
                                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200">
                                    {entry.profileImage ? (
                                        <img src={entry.profileImage} alt={entry.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
                                            <FiUser className="text-2xl" />
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                    {entry.rank}
                                </div>
                            </div>
                            <div className={`w-full ${height} bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl flex flex-col items-center justify-center p-4 border border-gray-100 dark:border-gray-700`}>
                                <p className="font-bold text-gray-900 dark:text-white text-sm truncate w-full text-center">{entry.name}</p>
                                <p className="text-primary-600 dark:text-primary-400 font-black text-lg">{entry.totalPoints.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">XP Points</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* List View */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Full Rankings</h2>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-500">
                            <FiTrendingUp /> Global
                        </div>
                    </div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {leaderboard.map((entry) => (
                        <motion.div 
                            key={entry.userId}
                            whileHover={{ x: 10 }}
                            className="flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="w-10 text-center font-black text-gray-400 text-lg">
                                #{entry.rank}
                            </div>
                            
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                {entry.profileImage ? (
                                    <img src={entry.profileImage} alt={entry.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-400">
                                        <FiUser />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-grow">
                                <h4 className="font-bold text-gray-900 dark:text-white">{entry.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><FiAward className="text-primary-500" /> Level {entry.level}</span>
                                    <span className="flex items-center gap-1"><FiZap className="text-orange-500" /> {entry.streak} Day Streak</span>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-lg font-black text-primary-600 dark:text-primary-400">{entry.totalPoints.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total XP</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            
            <div className="mt-10 p-6 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-3xl text-white flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold mb-1">Want to climb higher?</h3>
                    <p className="text-primary-100 text-sm">Complete lessons and quizzes to earn massive XP boosts!</p>
                </div>
                <button className="px-6 py-3 bg-white text-primary-600 font-bold rounded-2xl shadow-lg hover:bg-primary-50 transition-colors">
                    Start Learning
                </button>
            </div>
        </div>
    );
};

export default Leaderboard;
