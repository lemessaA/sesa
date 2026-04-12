import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Play, ChevronRight } from 'lucide-react';

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
    hasPaidAccess: boolean;
    accessLevel: 'free' | 'paid' | 'none';
    enrollmentStatus: 'none' | 'pending' | 'approved' | 'paid';
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
        `${import.meta.env.VITE_API_URL}/smart-enrollment/courses/${courseId}/with-access`,
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
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    navigate(`/payment/${courseId}`);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isAccessible) {
      setSelectedLesson(lesson);
      navigate(`/courses/${courseId}/lesson/${lesson._id}`);
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
          <p className="text-red-600 dark:text-red-400">{error || 'Course not found'}</p>
          <button
            onClick={() => navigate('/student/browse')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {course.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {course.gradeLevel && <span>{course.gradeLevel}</span>}
                {course.level && <span>•</span>}
                {course.level && <span className="capitalize">{course.level}</span>}
                {course.price > 0 && <span>•</span>}
                {course.price > 0 && <span className="font-semibold text-primary">${course.price}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {course.userAccess.accessLevel === 'paid' ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">✓ Enrolled</span>
                ) : course.userAccess.accessLevel === 'free' ? (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Free Preview</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">Not enrolled</span>
                )}
              </div>
            </div>
          </div>

          {/* Instructor Info */}
          {course.instructor && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {course.instructor.profileImage && (
                <img
                  src={course.instructor.profileImage}
                  alt={course.instructor.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Instructor</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {course.instructor.name}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedLesson && selectedLesson.isAccessible ? (
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
                {/* Video Player */}
                <div className="bg-black aspect-video flex items-center justify-center">
                  {selectedLesson.videoUrl ? (
                    <video
                      src={selectedLesson.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-white text-center">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Video not available</p>
                    </div>
                  )}
                </div>

                {/* Lesson Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary">
                      Lesson {selectedLesson.order}
                    </span>
                    {selectedLesson.isFree && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        FREE PREVIEW
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {selectedLesson.title}
                  </h2>
                  {selectedLesson.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedLesson.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-12 text-center">
                <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Content Locked
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Enroll in this course to access all lessons
                </p>
                <button
                  onClick={handleUnlock}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Unlock Full Course
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Lessons List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden sticky top-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Course Content
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {accessibleLessons.length} of {course.lessons?.length || 0} lessons
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Accessible Lessons */}
                {accessibleLessons.map((lesson) => (
                  <button
                    key={lesson._id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                      selectedLesson?._id === lesson._id
                        ? 'bg-primary bg-opacity-10 border-l-4 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Play className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Lesson {lesson.order}
                        </p>
                        {lesson.isFree && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Locked Lessons */}
                {lockedLessons.length > 0 && (
                  <>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Locked Content
                      </p>
                    </div>
                    {lockedLessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="p-4 border-b border-gray-200 dark:border-gray-700 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <Lock className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
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
              {course.canUnlock && course.userAccess.accessLevel !== 'paid' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <button
                    onClick={handleUnlock}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium flex items-center justify-center gap-2"
                  >
                    Unlock Full Course
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2">
                    ${course.price}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
