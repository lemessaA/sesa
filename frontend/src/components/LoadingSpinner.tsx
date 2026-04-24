import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullPage = false, 
  size = 'md',
  label = "Loading SESA Academy..."
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-20 h-20 border-4'
  };

  const containerClasses = fullPage 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md"
    : "flex flex-col items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer glow */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full blur-xl bg-indigo-500/20`} />
        
        {/* Main Spinner */}
        <motion.div
          className={`${sizeClasses[size]} border-indigo-500/20 border-t-indigo-500 rounded-full relative z-10`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner Counter-rotating Spinner */}
        <motion.div
          className={`absolute inset-0 ${sizeClasses[size]} border-transparent border-t-cyan-400 rounded-full z-20`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>
      </div>
      
      {label && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-col items-center"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 font-semibold tracking-wider text-sm uppercase">
            {label}
          </span>
          <div className="mt-2 flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LoadingSpinner;
