import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, type TranslationKey } from '../i18n/translations';

type Language = 'en' | 'am';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    /** Key-based: t('key') or legacy: t('English', 'አማርኛ') */
    t: (keyOrEn: TranslationKey | string, am?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    // Sync from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('language');
        if (saved === 'en' || saved === 'am') {
            setLanguage(saved as Language);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }
    };

    const t = useCallback((keyOrEn: TranslationKey | string, am?: string): string => {
        const entry = translations[keyOrEn as TranslationKey];
        if (entry) return language === 'en' ? entry.en : entry.am;
        return language === 'en' ? keyOrEn : (am ?? keyOrEn);
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
