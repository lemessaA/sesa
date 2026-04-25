import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

export interface PageLayoutProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
    className?: string;
    /** Optional badge e.g. "AI-Powered" */
    badge?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl';
}

const maxWidthClass = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
};

export const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    breadcrumbs,
    children,
    className,
    badge,
    maxWidth = '7xl',
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn('min-h-[70vh] px-4 py-8 sm:px-6 lg:px-8', className)}
        >
            <div className={cn('mx-auto', maxWidthClass[maxWidth])}>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
                        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                        {breadcrumbs.map((item, i) => (
                            <React.Fragment key={i}>
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                {item.path ? (
                                    <Link to={item.path} className="hover:text-primary transition-colors">{item.label}</Link>
                                ) : (
                                    <span className="text-dark-bg dark:text-white font-medium">{item.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
                <div className="mb-8">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-dark-bg dark:text-white">{title}</h1>
                        {badge}
                    </div>
                    {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>}
                </div>
                {children}
            </div>
        </motion.div>
    );
};

export default PageLayout;
