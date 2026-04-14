import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Play, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import CourseSection from './CourseSection';
import LockedContentCard from './LockedContentCard';
import UnlockButton from './UnlockButton';
import EnrollmentBadge from './EnrollmentBadge';

interface Lesson {
  _id: string;
  title: string;
  order: number;
  isFree: boolean;
  isAccessible: boolean;
  description?: string;
  videoUrl?: string;
  duration?: number;
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  price: number;
  instructor: {
    name: string;
    profileImage?: string;
  };
  lessons: Lesson[];
  userAccess: {
    hasAccess: boolean;
    accessLevel: 'free' | 'paid' | 'none';
    enrollmentStatus: 'active' | 'expired' | 'cancelled' | 'none';
  };
  canUnlock: boolean;
  gradeLevel?: string;
  level?: string;
  rating?: number;
  reviews?: any[];
}

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!courseId) return;
    fetchCourseWithAccess();
  }, [courseId, token]);

  const fetchCourseWithAccess = async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/enrollments/courses/${courseId}/with-access`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to load course');
      }

      const data = await response.json();
      setCourse(data.course);

      // Set first accessible lesson as selected
      const firstAccessible = data.course.lessons?.find((l: Lesson) => l.isAccessible);
      if (firstAccessible) {
        setSelectedLesson(firstAccessible);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    if (!isAuthenticated) {
      toast.info('Please log in to enroll in this course');
      navigate('/auth');
      return;
    }
    navigate(`/payment/${courseId}`);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isAccessible) {
      setSelectedLesson(lesson);
    } else {
      toast.warning('You\'re in preview mode. Enroll to unlock full course.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/student/browse')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const accessibleLessons = course.lessons?.filter(l => l.isAccessible) || [];
  const lockedLessons = course.lessons?.filter(l => !l.isAccessible) || [];

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="bg-gradient-to-br from-white via-light to-white dark:from-dark-card dark:via-dark-bg dark:to-dark-card rounded-2xl shadow-premium dark:shadow-lg p-8 mb-8 border border-white/40 dark:border-white/10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-lg">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {course.gradeLevel && (
                  <span className="px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded-full font-bold">
                    {course.gradeLevel}
                  </span>
                )}
                {course.level && (
                  <span className="px-4 py-2 bg-gradient-to-r from-secondary/20 to-secondary/10 text-secondary rounded-full font-bold capitalize">
                    {course.level}
                  </span>
                )}
                {course.price > 0 && (
                  <span className="px-4 py-2 bg-gradient-to-r from-warning/20 to-warning/10 text-warning font-bold rounded-full">
                    ${course.price}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right ml-4">
              <EnrollmentBadge accessLevel={course.userAccess.accessLevel} />
            </div>
          </div>

          {/* Instructor Info */}
          {course.instructor && (
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-white/10">
              {course.instructor.profileImage && (
                <img
                  src={course.instructor.profileImage}
                  alt={course.instructor.name}
                  className="w-14 h-14 rounded-full border-2 border-primary shadow-lg"
                />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Instructor
                </p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  {course.instructor.name}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 w-full">
            {selectedLesson && selectedLesson.isAccessible ? (
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-premium dark:shadow-lg overflow-hidden border border-white/20 dark:border-white/5">
                {/* Video Player */}
                <div className="bg-black w-full aspect-video flex items-center justify-center relative group cursor-pointer hover:bg-gray-900 transition">
                  {selectedLesson.videoUrl ? (
                    <video
                      src={selectedLesson.videoUrl}
                      controls
                      controlsList="nodownload"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-white text-center p-6">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50 group-hover:opacity-75 transition" />
                      <p className="text-lg font-semibold">Video not available</p>
                    </div>
                  )}
                </div>

                {/* Lesson Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Lesson {selectedLesson.order}
                    </span>
                    {selectedLesson.isFree && (
                      <span className="text-xs font-bold bg-gradient-to-r from-success to-success/70 text-white px-3 py-1 rounded-full">
                        ✓ FREE PREVIEW
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                    {selectedLesson.title}
                  </h2>
                  {selectedLesson.description && (
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedLesson.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <LockedContentCard onUnlock={handleUnlock} />
            )}
          </div>

          {/* Sidebar - Lessons List */}
          <div className="lg:col-span-1 w-full">
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-premium dark:shadow-lg overflow-hidden sticky top-4 border border-white/20 dark:border-white/5">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Course Content
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {accessibleLessons.length} of {course.lessons?.length || 0} lessons
                </p>
              </div>

              <div className="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {/* Accessible Lessons */}
                {accessibleLessons.map((lesson) => (
                  <button
                    key={lesson._id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 transition active:scale-95 ${
                      selectedLesson?._id === lesson._id
                        ? 'bg-gradient-to-r from-primary/20 to-secondary/10 dark:from-primary/30 dark:to-secondary/20 border-l-4 border-l-primary shadow-md'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Play className="w-4 h-4 mt-1 text-primary flex-shrink-0 font-bold" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Lesson {lesson.order}
                        </p>
                        {lesson.isFree && (
                          <span className="text-xs font-bold text-success">
                            ✓ Free
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Locked Lessons */}
                {lockedLessons.length > 0 && (
                  <>
                    <div className="px-4 py-3 bg-gradient-to-r from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-bold text-warning uppercase tracking-widest">
                        🔒 Locked Content
                      </p>
                    </div>
                    {lockedLessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="p-4 border-b border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-80 transition"
                      >
                        <div className="flex items-start gap-3">
                          <Lock className="w-4 h-4 mt-1 text-warning flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Lesson {lesson.order}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Unlock Button */}
              {course.userAccess.accessLevel !== 'paid' && (
                <UnlockButton
                  price={course.price}
                  onUnlock={handleUnlock}
                  isAuthenticated={isAuthenticated}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
