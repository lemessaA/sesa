import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, Clock, ChevronRight } from 'lucide-react';

interface Enrollment {
  courseId: string;
  enrollmentDate: string;
  status: 'active' | 'expired' | 'cancelled';
  accessLevel: 'free' | 'paid';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

interface EnrollmentCardProps {
  enrollment: Enrollment;
  courseName?: string;
  courseImage?: string;
}

const EnrollmentCard: React.FC<EnrollmentCardProps> = ({
  enrollment,
  courseName = 'Course',
  courseImage,
}) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress loading
    const timer = setTimeout(() => {
      setProgress(Math.floor(Math.random() * 60) + 20);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getAccessBadge = () => {
    if (enrollment.accessLevel === 'paid') {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-success to-success/70 text-white rounded-full text-sm font-bold">
          <CheckCircle className="w-4 h-4" />
          Full Access
        </div>
      );
    }
    if (enrollment.accessLevel === 'free') {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm font-bold">
          <BookOpen className="w-4 h-4" />
          Free Preview
        </div>
      );
    }
    return null;
  };

  const getStatusIcon = () => {
    if (enrollment.status === 'active') {
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }
    if (enrollment.status === 'expired') {
      return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
    return <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />;
  };

  const enrollmentDate = new Date(enrollment.enrollmentDate);
  const formattedDate = enrollmentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-premium dark:shadow-lg overflow-hidden hover:shadow-premium-hover transition border border-white/20 dark:border-white/5">
      {/* Course Image */}
      {courseImage && (
        <div className="h-40 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10 overflow-hidden relative">
          <img
            src={courseImage}
            alt={courseName}
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {courseName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enrolled {formattedDate}
            </p>
          </div>
          <div className="flex-shrink-0 ml-2">
            {getStatusIcon()}
          </div>
        </div>

        {/* Access Badge */}
        <div className="mb-4">
          {getAccessBadge()}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-bold text-primary">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Info */}
        <div className="mb-4 p-3 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-lg border border-primary/10 dark:border-primary/20">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">Status:</span>{' '}
            <span className="capitalize font-semibold text-primary">{enrollment.status}</span>
          </p>
          {enrollment.approvalStatus && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-bold text-gray-900 dark:text-white">Approval:</span>{' '}
              <span className="capitalize font-semibold text-secondary">{enrollment.approvalStatus}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/courses/${enrollment.courseId}`)}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold flex items-center justify-center gap-2"
        >
          {progress > 0 ? 'Continue Learning' : 'Start Course'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EnrollmentCard;
