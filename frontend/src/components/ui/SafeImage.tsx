import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /** Fallback content when image fails (e.g. initials, icon). If not provided, shows a generic placeholder. */
    fallback?: React.ReactNode;
    /** Optional wrapper class */
    wrapperClassName?: string;
}

/**
 * Image component that never shows a broken icon. On load error, shows fallback or a styled placeholder.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
    src,
    alt,
    className,
    wrapperClassName,
    fallback,
    onError,
    ...rest
}) => {
    const [errored, setErrored] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setErrored(true);
        onError?.(e);
    };

    const handleLoad = () => setLoaded(true);

    if (!src || errored) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                    'flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-slate-400 overflow-hidden',
                    wrapperClassName,
                    className
                )}
                aria-hidden
            >
                {fallback ?? (
                    <span className="flex items-center justify-center">
                        <ImageOff className="w-1/2 h-1/2 max-w-12 max-h-12" aria-hidden />
                    </span>
                )}
            </motion.div>
        );
    }

    return (
        <span className={cn('relative block h-full w-full', wrapperClassName)}>
            <img
                src={src}
                alt={alt}
                className={cn('h-full w-full object-cover', className, !loaded && 'opacity-0')}
                onError={handleError}
                onLoad={handleLoad}
                loading={rest.loading ?? 'lazy'}
                decoding="async"
                {...rest}
            />
            {!loaded && (
                <motion.div
                    layout
                    className="absolute inset-0 flex items-center justify-center bg-slate-800/80"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: loaded ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="h-6 w-6 rounded-full border-2 border-cyan-400/50 border-t-cyan-400"
                    />
                </motion.div>
            )}
        </span>
    );
};

export default SafeImage;
