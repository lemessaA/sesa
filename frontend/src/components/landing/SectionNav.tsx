import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, BookOpen, GraduationCap, Play, ImageIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const SECTIONS = [
    { id: 'motivation', labelKey: 'motivation' as const, icon: Sparkles },
    { id: 'why-sesa', labelKey: 'whyChooseSesa' as const, icon: Zap },
    { id: 'subjects', labelKey: 'subjects' as const, icon: BookOpen },
    { id: 'grades', labelKey: 'highSchoolPrep' as const, icon: GraduationCap },
    { id: 'demo-videos', labelKey: 'demos' as const, icon: Play },
    { id: 'gallery', labelKey: 'gallery' as const, icon: ImageIcon },
] as const;

const SectionNav: React.FC = () => {
    const { t } = useLanguage();
    const [activeSection, setActiveSection] = React.useState<string>(SECTIONS[0].id);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]?.target?.id) {
                    setActiveSection(visible[0].target.id);
                }
            },
            { threshold: [0.35, 0.6, 0.85], rootMargin: '-20% 0px -35% 0px' }
        );

        SECTIONS.forEach((section) => {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:flex"
            aria-label="Section navigation"
        >
            <div className="flex flex-col gap-1.5 rounded-2xl border border-white/20 bg-[#06112b]/70 p-1.5 shadow-2xl backdrop-blur-xl">
                {SECTIONS.map((section, i) => {
                    const isActive = activeSection === section.id;
                    return (
                        <motion.button
                            key={section.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.05 }}
                            whileHover={{ x: 3, scale: 1.04 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => scrollTo(section.id)}
                            className={`group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all duration-300 ${
                                isActive
                                    ? 'border-cyan-300/60 bg-cyan-400/20 text-white shadow-lg shadow-cyan-600/20'
                                    : 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-200/40 hover:bg-white/15'
                            }`}
                            title={t(section.labelKey)}
                            aria-current={isActive ? 'true' : 'false'}
                        >
                            <section.icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-cyan-200' : 'text-cyan-300/90'}`} />
                            <span className="max-w-[90px] truncate">{t(section.labelKey)}</span>
                            <span className="pointer-events-none absolute right-full mr-2 rounded-md border border-white/20 bg-[#081632]/95 px-2 py-1 text-[10px] font-medium text-slate-100 opacity-0 shadow-xl transition-all duration-300 group-hover:opacity-100">
                                {t(section.labelKey)}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.nav>
    );
};

export default SectionNav;
