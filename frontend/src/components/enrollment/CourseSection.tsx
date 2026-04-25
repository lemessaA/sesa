import React from 'react';
import { BookOpen, Lock } from 'lucide-react';

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  gradeLevel?: string;
  level?: string;
  isFree?: boolean;
}

interface CourseSectionProps {
  title: string;
  courses: Course[];
  type: 'free' | 'paid';
  onEnroll: (courseId: string) => void;
}

const CourseSection: React.FC<CourseSectionProps> = ({ title, courses, type, onEnroll }) => {
  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        {type === 'free' ? (
          <BookOpen className="w-6 h-6 text-success" />
        ) : (
          <Lock className="w-6 h-6 text-warning" />
        )}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <span className="ml-auto text-sm font-semibold text-gray-600 dark:text-gray-400">
          {courses.length} courses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-lg transition overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover hover:scale-105 transition"
                  loading="lazy"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                {course.gradeLevel && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                    {course.gradeLevel}
                  </span>
                )}
                {course.level && (
                  <span className="px-2 py-1 bg-secondary/10 text-secondary rounded capitalize">
                    {course.level}
                  </span>
                )}
              </div>

              {/* Button */}
              <button
                onClick={() => onEnroll(course._id)}
                className={`w-full py-2 rounded-lg font-bold transition ${
                  type === 'free'
                    ? 'bg-success/20 text-success hover:bg-success/30'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {type === 'free' ? 'Start Free' : 'Enroll Now'}
              </button>

              {/* Price */}
              {type === 'paid' && course.price > 0 && (
                <p className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 mt-2">
                  ${course.price}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseSection;
