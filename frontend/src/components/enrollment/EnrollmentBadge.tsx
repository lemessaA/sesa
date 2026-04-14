import React from 'react';
import { CheckCircle, BookOpen, Lock } from 'lucide-react';

interface EnrollmentBadgeProps {
  accessLevel: 'free' | 'paid' | 'none';
}

const EnrollmentBadge: React.FC<EnrollmentBadgeProps> = ({ accessLevel }) => {
  if (accessLevel === 'paid') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-success to-success/70 text-white rounded-full font-bold shadow-lg">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        <CheckCircle className="w-4 h-4" />
        ✓ Enrolled
      </div>
    );
  }

  if (accessLevel === 'free') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold shadow-lg">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
        <BookOpen className="w-4 h-4" />
        Free Preview
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-bold">
      <Lock className="w-4 h-4" />
      Not enrolled
    </div>
  );
};

export default EnrollmentBadge;
