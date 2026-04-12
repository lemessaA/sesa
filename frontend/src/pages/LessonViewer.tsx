import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Lock, AlertCircle } from 'lucide-react';

interface Lesson {
  _id: string;
  title: string;
  order: number;
  isFree: boolean;
  isAccessible: boolean;
  description?: string;
  videoUrl?: string;
  duration?: number;
  nextLessonId?: string;
  previousLessonId?: string;
}

const LessonViewer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    fetchLesson();
  }, [courseId, lessonId, token]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/smart-enrollment/courses/${courseId}/lessons/${lessonId}`,
        { headers }
      );

      if (response.status === 403) {
        setError('Access denied. Please purchase this course to view this lesson.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load lesson');
      }

      const data = await response.json();
      setLesson(data.lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleNextLesson = () => {
    if (lesson?.nextLessonId) {
      navigate(`/courses/${courseId}/lesson/${lesson.nextLessonId}`);
    }
  };

  const handlePreviousLesson = () => {
    if (lesson?.previousLessonId) {
      navigate(`/courses/${courseId}/lesson/${lesson.previousLessonId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Access Denied
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back to Course
            </button>
            <button
              onClick={() => navigate(`/payment/${courseId}`)}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Unlock Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Lesson not found</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark transition"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Course
        </button>

        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-8 aspect-video flex items-center justify-center">
          {lesson.videoUrl ? (
            <video
              src={lesson.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          ) : (
            <div className="text-white text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Video not available</p>
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-primary">
              Lesson {lesson.order}
            </span>
            {lesson.isFree && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                FREE PREVIEW
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {lesson.title}
          </h1>

          {lesson.description && (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {lesson.description}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={handlePreviousLesson}
            disabled={!lesson.previousLessonId}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Lesson
          </button>

          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Course Overview
          </button>

          <button
            onClick={handleNextLesson}
            disabled={!lesson.nextLessonId}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Lesson
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
