import React from 'react';
import { Lock } from 'lucide-react';

interface LockedContentCardProps {
  onUnlock: () => void;
}

const LockedContentCard: React.FC<LockedContentCardProps> = ({ onUnlock }) => {
  return (
    <div className="bg-gradient-to-br from-white to-light dark:from-dark-card dark:to-dark-bg rounded-xl shadow-premium dark:shadow-lg p-12 text-center border border-white/20 dark:border-white/5">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-warning/20 rounded-full mb-4">
        <Lock className="w-8 h-8 text-warning" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Content Locked
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Enroll in this course to access all lessons and unlock your learning potential.
      </p>
      <button
        onClick={onUnlock}
        className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold"
      >
        Unlock Full Course
      </button>
    </div>
  );
};

export default LockedContentCard;
