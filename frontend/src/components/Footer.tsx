import React from 'react';
import { motion } from 'framer-motion';
import {
    Facebook,
    Globe,
    GraduationCap,
    Instagram,
    Linkedin,
    Mail,
    MapPin,
    Phone,
    Twitter,
    Youtube,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

type FooterProps = {
    compact?: boolean;
};

const Footer: React.FC<FooterProps> = ({ compact = false }) => {
    const { t } = useLanguage();
    const year = new Date().getFullYear();

    if (compact) {
        return (
            <footer className="bg-dark-bg text-gray-200 border-t border-white/10">
                <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <span className="inline-flex items-center gap-1 text-sm font-extrabold text-white">
                                SESA <Globe className="h-3.5 w-3.5 text-emerald-400" /> Academy
                            </span>
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-gray-300">
                            <Link to="/#subjects" className="hover:text-white transition-colors">{t('subjects')}</Link>
                            <Link to="/#demo-videos" className="hover:text-white transition-colors">{t('demos')}</Link>
                            <Link to="/marketplace" className="hover:text-white transition-colors">{t('marketplace')}</Link>
                            <Link to="/dashboard" className="hover:text-white transition-colors">{t('dashboard')}</Link>
                        </div>
                        <p className="text-[11px] text-gray-400">(c) {year} SESA Academy</p>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-dark-bg text-gray-300">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-success to-emerald-500" />

            <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <GraduationCap className="h-7 w-7 text-primary" />
                            <span className="inline-flex items-center gap-1 text-xl font-black text-white">
                                SESA <Globe className="h-5 w-5 text-emerald-400" /> Academy
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-400">
                            {t(
                                'Safe Educational & Skill Academy delivers exam-focused lessons, video learning, and global-ready skills.',
                                'Safe Educational & Skill Academy delivers exam-focused lessons, video learning, and global-ready skills.'
                            )}
                        </p>
                        <div className="flex items-center gap-2">
                            {[Facebook, Twitter, Instagram, Youtube, Linkedin].map((Icon, index) => (
                                <motion.a
                                    key={index}
                                    href="/"
                                    aria-label="Social link"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="rounded-lg bg-white/5 p-2 transition-colors hover:bg-primary hover:text-white"
                                >
                                    <Icon className="h-4 w-4" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{t('learning')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/#subjects" className="hover:text-primary transition-colors">{t('subjects')}</Link></li>
                            <li><Link to="/#demo-videos" className="hover:text-primary transition-colors">{t('demoVideos')}</Link></li>
                            <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t('studentDashboard')}</Link></li>
                            <li><Link to="/auth" className="hover:text-primary transition-colors">{t('studentLogin')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{t('company')}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/faq" className="hover:text-primary transition-colors">{t('about')}</Link></li>
                            <li><Link to="/faq" className="hover:text-primary transition-colors">{t('privacy')}</Link></li>
                            <li><Link to="/faq" className="hover:text-primary transition-colors">{t('terms')}</Link></li>
                            <li><Link to="/auth" className="hover:text-primary transition-colors">{t('support')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{t('contact')}</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                                <span>{t('addisAbaba')}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>+251 911 000 000</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                <span>support@sesa-academy.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                <span>www.sesa-academy.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-gray-500">
                    (c) {year} SESA Academy. {t('allRightsReserved')}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
