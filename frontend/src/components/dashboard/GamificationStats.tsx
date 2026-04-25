import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiZap } from 'react-icons/fi';

interface GamificationData {
    totalPoints: number;
    level: number;
    streak: {
        current: number;
        longest: number;
    };
    badges: any[];
}

const GamificationStats: React.FC = () => {
    const [stats, setStats] = useState<GamificationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/gamification/my-stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching gamification stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
            ))}
        </div>
    );

    if (!stats) return null;

    const pointsToNextLevel = 1000 - (stats.totalPoints % 1000);
    const progressToNextLevel = (stats.totalPoints % 1000) / 10;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Level & Points Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden"
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Current Level</p>
                        <h3 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Level {stats.level}</h3>
                    </div>
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                        <FiAward className="text-2xl text-primary-600 dark:text-primary-400" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{stats.totalPoints} XP</span>
                        <span className="text-gray-500">{pointsToNextLevel} XP to Level {stats.level + 1}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNextLevel}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Streak Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Daily Streak</p>
                        <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.streak.current} Days</h3>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                        <FiZap className="text-2xl text-orange-600 dark:text-orange-400" />
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Longest streak: <span className="font-semibold text-orange-500">{stats.streak.longest} days</span>
                </p>
            </motion.div>

            {/* Achievements Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Badges Earned</p>
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.badges.length}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <FiTrendingUp className="text-2xl text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                    {stats.badges.slice(0, 5).map((badge, idx) => (
                        <div 
                            key={idx} 
                            title={badge.name}
                            className="inline-block h-8 w-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg"
                        >
                            {badge.icon}
                        </div>
                    ))}
                    {stats.badges.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 text-[10px] font-bold">
                            +{stats.badges.length - 5}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default GamificationStats;
