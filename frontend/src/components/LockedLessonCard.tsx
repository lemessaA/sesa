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
    <div className="relative bg-gradient-to-br from-white to-light dark:from-dark-card dark:to-dark-bg rounded-xl shadow-premium dark:shadow-lg overflow-hidden group border border-white/20 dark:border-white/5">
      {/* Blur Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50 group-hover:via-black/40 group-hover:to-black/60 transition z-10" />

      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-accent/20 to-primary/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>

      {/* Content */}
      <div className="relative z-20 p-6 h-full flex flex-col justify-between">
        {/* Lock Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-warning/40 to-warning/20 backdrop-blur-sm p-4 rounded-full border border-warning/30">
            <Lock className="w-8 h-8 text-warning" />
          </div>
        </div>

        {/* Lesson Info */}
        <div className="text-center mb-6">
          <p className="text-sm font-bold text-white/90 mb-2 uppercase tracking-widest">Lesson {lessonOrder}</p>
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
            {lessonTitle}
          </h3>
          <p className="text-sm text-white/80">
            Unlock full course to access
          </p>
        </div>

        {/* Unlock Button */}
        <button
          onClick={onUnlock}
          className="w-full px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2 group/btn"
        >
          Unlock Full Course
          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
        </button>

        {/* Price */}
        <p className="text-center text-white/90 text-sm mt-3 font-bold">
          ${coursePrice}
        </p>
      </div>

      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5" />
    </div>
  );
};

export default LockedLessonCard;
