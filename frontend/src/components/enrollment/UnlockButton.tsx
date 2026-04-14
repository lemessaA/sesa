import React from 'react';
import { ChevronRight } from 'lucide-react';

interface UnlockButtonProps {
  price: number;
  onUnlock: () => void;
  isAuthenticated: boolean;
}

const UnlockButton: React.FC<UnlockButtonProps> = ({ price, onUnlock, isAuthenticated }) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/10 to-secondary/5 dark:from-primary/20 dark:to-secondary/10">
      <button
        onClick={onUnlock}
        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2 active:scale-95"
      >
        Unlock Full Course
        <ChevronRight className="w-4 h-4" />
      </button>
      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-3 font-bold">
        ${price}
      </p>
      {!isAuthenticated && (
        <p className="text-xs text-warning text-center mt-2">
          Log in to enroll
        </p>
      )}
    </div>
  );
};

export default UnlockButton;
