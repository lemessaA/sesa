import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { ShoppingBag, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useLanguage } from '../context/LanguageContext';

const Marketplace: React.FC = () => {
    const { t } = useLanguage();

    const features = [
        { icon: BookOpen, title: t('browseCourses'), desc: 'Enroll in courses and pay securely.', path: '/student/browse' },
        { icon: Sparkles, title: t('aiPowered'), desc: 'AI-powered recommendations and progress insights.', path: '/dashboard' },
    ];

    return (
        <PageLayout
            title={t('marketplace')}
            subtitle="School management & online learning marketplace. Browse courses, enroll, and pay in one place."
            breadcrumbs={[{ label: t('marketplace') }]}
            badge={
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-400/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('aiPowered')}
                </span>
            }
        >
            <div className="grid gap-6 sm:grid-cols-2">
                {features.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Link
                            to={item.path}
                            className="block rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card p-6 shadow-premium hover:shadow-premium-hover hover:border-primary/30 transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-dark-bg dark:text-white group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-primary">
                                        {t('getStarted')}
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-6"
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-bold text-dark-bg dark:text-white">Ready to enroll?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Go to Course Library or Dashboard to continue.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/student/browse"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary transition-colors"
                        >
                            {t('browseCourses')}
                        </Link>
                        <Link
                            to="/payment"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-dark-bg dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {t('checkout')}
                        </Link>
                    </div>
                </div>
            </motion.div>
        </PageLayout>
    );
};

export default Marketplace;
