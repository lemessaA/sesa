import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, AlertCircle, Play } from 'lucide-react';
import { extractYoutubeVideoId, getYoutubeEmbedUrl, isLikelyDirectVideoFileUrl } from '../utils/youtube';

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
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-bg">
        <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-xl shadow-premium dark:shadow-lg p-6 border border-warning/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-warning/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Access Denied
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            >
              Back to Course
            </button>
            <button
              onClick={() => navigate(`/payment/${courseId}`)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold"
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
      <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark-bg">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Lesson not found</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition font-bold"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="mb-6 flex items-center gap-2 text-primary hover:text-secondary transition font-semibold"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Course
        </button>

        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-premium dark:shadow-lg mb-8 aspect-video flex items-center justify-center border border-primary/20">
          {lesson.videoUrl ? (
            (() => {
              // Check if it's a YouTube URL using the utility function
              const youtubeId = extractYoutubeVideoId(lesson.videoUrl);
              
              if (youtubeId) {
                return (
                  <iframe
                    src={getYoutubeEmbedUrl(youtubeId)}
                    title={lesson.title}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                );
              } else if (isLikelyDirectVideoFileUrl(lesson.videoUrl)) {
                return (
                  <video
                    src={lesson.videoUrl}
                    controls
                    autoPlay
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                  />
                );
              } else {
                // Fallback for other video URLs - try as direct video first, then iframe
                return (
                  <video
                    src={lesson.videoUrl}
                    controls
                    autoPlay
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // If video fails to load, try as iframe
                      const videoElement = e.target as HTMLVideoElement;
                      const container = videoElement.parentElement;
                      if (container) {
                        container.innerHTML = `
                          <iframe
                            src="${lesson.videoUrl}"
                            title="${lesson.title}"
                            className="w-full h-full"
                            frameBorder="0"
                            allowFullScreen
                          />
                        `;
                      }
                    }}
                  />
                );
              }
            })()
          ) : (
            <div className="text-white text-center p-6">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">Video not available</p>
              <p className="text-sm text-gray-400 mt-2">Check back soon for video content</p>
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-premium dark:shadow-lg p-8 mb-8 border border-white/20 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              Lesson {lesson.order}
            </span>
            {lesson.isFree && (
              <span className="text-xs font-bold bg-gradient-to-r from-success to-success/70 text-white px-3 py-1 rounded-full">
                ✓ FREE PREVIEW
              </span>
            )}
          </div>

          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            {lesson.title}
          </h1>

          {lesson.description && (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
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
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Lesson
          </button>

          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold"
          >
            Course Overview
          </button>

          <button
            onClick={handleNextLesson}
            disabled={!lesson.nextLessonId}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-bold"
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
