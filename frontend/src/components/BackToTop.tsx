import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const SCROLL_THRESHOLD = 400;

const BackToTop: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg"
                    aria-label="Back to top"
                >
                    <ArrowUp className="h-5 w-5" />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
