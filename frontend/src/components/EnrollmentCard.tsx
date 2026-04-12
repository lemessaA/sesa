import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, CheckCircle, Clock } from 'lucide-react';

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
  coursePrice?: number;
}

const EnrollmentCard: React.FC<EnrollmentCardProps> = ({
  enrollment,
  courseName = 'Course',
  courseImage,
  coursePrice = 0,
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
        <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Full Access
        </div>
      );
    }
    if (enrollment.accessLevel === 'free') {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
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
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Course Image */}
      {courseImage && (
        <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          <img
            src={courseImage}
            alt={courseName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {courseName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enrolled {formattedDate}
            </p>
          </div>
          <div className="flex-shrink-0">
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status Info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Status:</span>{' '}
            <span className="capitalize">{enrollment.status}</span>
          </p>
          {enrollment.approvalStatus && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-semibold">Approval:</span>{' '}
              <span className="capitalize">{enrollment.approvalStatus}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/courses/${enrollment.courseId}`)}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
        >
          {progress > 0 ? 'Continue Learning' : 'Start Course'}
        </button>
      </div>
    </div>
  );
};

export default EnrollmentCard;
