import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';

interface LockedLessonCardProps {
  lessonTitle: string;
  lessonOrder: number;
  coursePrice: number;
  courseId: string;
  onUnlock: () => void;
}

const LockedLessonCard: React.FC<LockedLessonCardProps> = ({
  lessonTitle,
  lessonOrder,
  coursePrice,
  courseId,
  onUnlock,
}) => {
  return (
    <div className="relative bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden group">
      {/* Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 group-hover:via-black/30 group-hover:to-black/50 transition z-10" />

      {/* Content */}
      <div className="relative z-20 p-6 h-full flex flex-col justify-between">
        {/* Lock Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Lesson Info */}
        <div className="text-center mb-6">
          <p className="text-sm text-white/80 mb-2">Lesson {lessonOrder}</p>
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {lessonTitle}
          </h3>
          <p className="text-sm text-white/70">
            Unlock full course to access
          </p>
        </div>

        {/* Unlock Button */}
        <button
          onClick={onUnlock}
          className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium flex items-center justify-center gap-2 group/btn"
        >
          Unlock Full Course
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
        </button>

        {/* Price */}
        <p className="text-center text-white/80 text-sm mt-3">
          ${coursePrice}
        </p>
      </div>

      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
    </div>
  );
};

export default LockedLessonCard;
