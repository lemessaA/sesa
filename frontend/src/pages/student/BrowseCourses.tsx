import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Lock,
    MessageSquare,
    PlayCircle,
    Play,
    Video,
    ChevronRight,
    Download,
    FileText,
    BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CourseReviews from './CourseReviews';
import { UserRole } from '../../types';
import { showError, showSuccess } from '../../utils/toast';
import { cn } from '../../utils/cn';
import QuizPlayer from '../../components/student/QuizPlayer';
import AssignmentPortal from '../../components/student/AssignmentPortal';
import CourseForum from '../../components/student/CourseForum';
import { getYoutubeEmbedSrc } from '../../utils/youtube';

interface Lesson {
    title: string;
    videoUrl: string;
    order: number;
    _id: string;
    resources?: {
        title: string;
        url: string;
        type: string;
    }[];
    isFree?: boolean;
}

interface CoursePreview {
    _id: string;
    title: string;
    description: string;
    youtubeVideoId?: string;
    thumbnailUrl?: string;
    previewVideoUrl?: string;
    resourceUrl?: string;
    lessons?: Lesson[];
    gradeLevel?: string;
    instructor?: {
        _id: string;
        name: string;
    };
    quizzes?: any[];
    assignments?: any[];
    category?: any;
}

interface MyEnrollmentCourse {
    _id: string;
    enrollmentStatus: 'pending' | 'approved' | 'rejected' | 'unknown';
    previewVideoUrl?: string;
    resourceUrl?: string;
    lessons?: Lesson[];
    youtubeVideoId?: string;
}

interface Category {
    _id: string;
    name: string;
    icon: string;
}

interface LibraryCourse extends CoursePreview {
    hasFullAccess: boolean;
    enrollmentStatus: 'pending' | 'approved' | 'rejected' | 'unknown';
    freeVideosLimit: number;
    category?: Category;
}


const toEmbedUrl = (
    course: Pick<LibraryCourse, 'youtubeVideoId' | 'resourceUrl' | 'previewVideoUrl' | 'lessons' | 'hasFullAccess'>,
    lessonIndex: number = 0
): string | null => {
    const lessonUrl = course.lessons?.[lessonIndex]?.videoUrl;
    const previewUrl = course.previewVideoUrl || course.resourceUrl;
    const sourceUrl = course.hasFullAccess && lessonUrl ? lessonUrl : lessonUrl || previewUrl;
    return getYoutubeEmbedSrc(sourceUrl || null, course.youtubeVideoId);
};

const BrowseCourses: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const searchQuery = searchParams.get('q') || searchParams.get('search') || '';

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const [courses, setCourses] = useState<LibraryCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [watchedPartOne, setWatchedPartOne] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<'video' | 'quiz' | 'assignment' | 'resources'>('video');
    const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);

    const selectedCourse = useMemo(
        () => courses.find((course) => course._id === selectedCourseId) ?? null,
        [courses, selectedCourseId]
    );

    const isModerator =
        user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.INSTRUCTOR;
    const canViewDiscussion = Boolean(user && (isModerator || selectedCourse?.hasFullAccess));

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All Subjects');
    const [selectedGrade, setSelectedGrade] = useState<string>('All Grades');

    useEffect(() => {
        if (user && !isModerator && user.role !== UserRole.PREMIUM_STUDENT) {
            setSelectedGrade('Grade 9');
        } else {
            setSelectedGrade('All Grades');
        }
    }, [user, isModerator]);

    const fetchCategories = async () => {
        try {
            const resp = await axios.get(`${API_URL}/categories`);
            setCategories(resp.data || []);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const matchesGrade = selectedGrade === 'All Grades' || c.gradeLevel === selectedGrade;
            
            const matchesSubject = selectedCategory === 'All Subjects' || 
                (typeof c.category === 'object' && c.category?._id === selectedCategory) ||
                (typeof c.category === 'string' && c.category === selectedCategory);

            const matchesSearch = !searchQuery || 
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.instructor?.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesGrade && matchesSubject && matchesSearch;
        });
    }, [courses, selectedGrade, selectedCategory, searchQuery]);

    const fetchLibrary = async (): Promise<void> => {
        try {
            setIsLoading(true);

            const previewResponse = await axios.get<CoursePreview[]>(`${API_URL}/courses`);
            const previewCourses = previewResponse.data ?? [];

            const enrollmentMap = new Map<string, MyEnrollmentCourse>();
            if (token) {
                const mineResponse = await axios.get<MyEnrollmentCourse[]>(`${API_URL}/courses/my/enrolled`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                (mineResponse.data ?? []).forEach((entry) => {
                    enrollmentMap.set(entry._id, entry);
                });
            }

            const normalized = previewCourses.map((course) => {
                const mine = enrollmentMap.get(course._id);
                const enrollmentStatus = mine?.enrollmentStatus ?? 'unknown';

                // Determine free video limit: Standardized to 1 (Part 1 is always free)
                const freeVideosLimit = 1;

                return {
                    ...course,
                    previewVideoUrl: mine?.previewVideoUrl ?? course.previewVideoUrl ?? course.resourceUrl,
                    resourceUrl: mine?.resourceUrl ?? course.resourceUrl,
                    youtubeVideoId: mine?.youtubeVideoId ?? course.youtubeVideoId,
                    lessons: mine?.lessons ?? course.lessons ?? [],
                    gradeLevel: course.gradeLevel || 'General',
                    hasFullAccess: enrollmentStatus === 'approved',
                    enrollmentStatus,
                    category: course.category as any
                } as LibraryCourse;
            });

            setCourses(normalized);
            if (!selectedCourseId && normalized.length > 0) {
                setSelectedCourseId(normalized[0]._id);
            }
        } catch (error) {
            console.error(error);
            showError('Failed to load course library');
        } finally {
            setIsLoading(false);
        }
    };


    const fetchCourseDetail = async (courseId: string): Promise<void> => {
        if (!token) return;

        try {
            const response = await axios.get<Partial<CoursePreview>>(`${API_URL}/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const detail = response.data;
            setCourses((prev) =>
                prev.map((course) => {
                    if (course._id !== courseId) return course;

                    return {
                        ...course,
                        resourceUrl: detail.resourceUrl ?? course.resourceUrl,
                        previewVideoUrl: detail.previewVideoUrl ?? course.previewVideoUrl ?? detail.resourceUrl ?? course.resourceUrl,
                        youtubeVideoId: detail.youtubeVideoId ?? course.youtubeVideoId,
                        lessons: Array.isArray(detail.lessons)
                            ? detail.lessons
                            : course.lessons ?? [],
                        quizzes: detail.quizzes ?? course.quizzes ?? [],
                        assignments: detail.assignments ?? course.assignments ?? [],
                    };
                })
            );
        } catch (_error) {
            // Keep existing preview data if detail fetch fails.
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, [token]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchCourseDetail(selectedCourseId);
        }
    }, [selectedCourseId, token]);

    // Track total watch time
    useEffect(() => {
        if (!selectedCourseId || !token || !selectedCourse?.hasFullAccess) return;

        const interval = setInterval(async () => {
            try {
                await axios.post(
                    `${API_URL}/progress/update`,
                    { courseId: selectedCourseId, minutesWatched: 1 },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                console.error('Failed to update watch progress', err);
            }
        }, 60000); // Every 1 minute

        return () => clearInterval(interval);
    }, [selectedCourseId, token, selectedCourse?.hasFullAccess]);

    const markPartOneWatched = (courseId: string): void => {
        setWatchedPartOne((prev) => ({ ...prev, [courseId]: true }));
        setSelectedCourseId(courseId);
        showSuccess('Great! Parts 1 & 2 are now unlocked for free preview.');
    };

    const requestEnrollment = async (course: LibraryCourse): Promise<void> => {
        if (!token) {
            showError('Please login to enroll in this course');
            navigate('/login');
            return;
        }

        // Navigate to payment page directly
        navigate(`/payment?courseId=${course._id}`);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#112240] px-3 py-2 text-sm text-slate-200 hover:border-blue-400/50 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>

                    <div className="rounded-2xl border border-slate-700 bg-[#112240] p-6 shadow-xl">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h1 className="text-3xl font-black text-white italic tracking-tight">Explore the <span className="text-blue-400">Knowledge Base</span></h1>
                                <p className="text-sm text-slate-400 mt-1 font-medium">
                                    Access expert-led courses across grades 8-12. Watch free previews before enrolling.
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="space-y-1.5 min-w-[140px]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Grade Level</label>
                                    <select
                                        value={selectedGrade}
                                        onChange={(e) => setSelectedGrade(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-bold text-slate-200 outline-none focus:border-blue-500 transition-all hover:bg-slate-800"
                                    >
                                        {(isModerator || user?.role === UserRole.PREMIUM_STUDENT || user?.role === UserRole.ADMIN) && (
                                            <option value="All Grades">All Grades</option>
                                        )}
                                        <option value="General">General</option>
                                        <option value="Grade 8">Grade 8</option>
                                        <option value="Grade 9">Grade 9</option>
                                        <option value="Grade 10">Grade 10</option>
                                        <option value="Grade 11">Grade 11</option>
                                        <option value="Grade 12">Grade 12</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 min-w-[200px]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subject / Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-bold text-slate-200 outline-none focus:border-blue-500 transition-all hover:bg-slate-800"
                                    >
                                        <option value="All Subjects">All Subjects</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-8">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            {isLoading ? (
                                <p className="md:col-span-2 rounded-xl border border-slate-700 bg-[#112240] px-4 py-8 text-center text-slate-300">
                                    Loading courses...
                                </p>
                            ) : filteredCourses.length === 0 ? (
                                <p className="md:col-span-2 rounded-xl border border-slate-700 bg-[#112240] px-4 py-8 text-center text-slate-300">
                                    No courses found for the selected grade.
                                </p>
                            ) : (
                                filteredCourses.map((course, index) => {
                                    const isSelected = selectedCourseId === course._id;
                                    const isLocked = !course.hasFullAccess;

                                    return (
                                        <motion.article
                                            key={course._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.04 }}
                                            className={`relative overflow-hidden rounded-2xl border p-4 ${isSelected
                                                    ? 'border-blue-400/60 bg-[#112240]'
                                                    : 'border-slate-700 bg-[#112240]/85 hover:border-slate-500'
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedCourseId(course._id);
                                                    setSelectedLessonIndex(0);
                                                }}
                                                className="w-full text-left"
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-semibold text-white">{course.title}</h3>
                                                        <p className="mt-1 line-clamp-2 text-xs text-slate-300">{course.description}</p>
                                                    </div>
                                                    {course.hasFullAccess ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-200">
                                                            <Lock className="h-3.5 w-3.5" />
                                                            Full Access
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[11px] text-amber-200">
                                                            <Lock className="h-3.5 w-3.5" />
                                                            Locked
                                                        </span>
                                                    )}
                                                </div>
                                            </button>

                                            {course.enrollmentStatus === 'pending' && (
                                                <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-blue-500/15 px-2 py-1 text-[11px] text-blue-100">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    Awaiting Approval
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => {
                                                        markPartOneWatched(course._id);
                                                        setSelectedLessonIndex(0);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900/60 px-2.5 py-1.5 text-xs text-slate-100 hover:border-blue-400/50"
                                                >
                                                    <PlayCircle className="h-3.5 w-3.5" />
                                                    Watch Free Previews
                                                </button>

                                                {/* NEW: Link to CoursePage */}
                                                <button
                                                    onClick={() => navigate(`/courses/${course._id}`)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-2.5 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/30"
                                                >
                                                    <PlayCircle className="h-3.5 w-3.5" />
                                                    View Full Course
                                                </button>

                                                {isLocked && (
                                                    <button
                                                        onClick={() => requestEnrollment(course)}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/20 px-2.5 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-500/30 disabled:opacity-60"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Pay & Enroll
                                                    </button>
                                                )}
                                            </div>
                                        </motion.article>
                                    );
                                })
                            )}
                        </div>
                    </motion.section>

                    {selectedCourse && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0a192f] shadow-2xl">
                            <div className="flex flex-col gap-3 border-b border-slate-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="inline-flex items-center gap-2 font-semibold text-white">
                                    <Video className="h-4 w-4 text-cyan-400" />
                                    {activeTab === 'video'
                                        ? 'Course Video'
                                        : activeTab === 'quiz'
                                          ? 'Quiz Assessment'
                                          : activeTab === 'assignment'
                                            ? 'Assignment Portal'
                                            : 'Resources'}
                                </h2>
                                <div className="flex flex-wrap gap-1 rounded-lg bg-slate-800/90 p-1">
                                    <button 
                                        onClick={() => setActiveTab('video')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'video' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Video
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('quiz')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'quiz' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Quizzes
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('assignment')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'assignment' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Tasks
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('resources')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'resources' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Resources
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 md:p-6">
                                {activeTab === 'quiz' && selectedQuiz ? (
                                    <QuizPlayer 
                                        quiz={selectedQuiz} 
                                        onComplete={(score) => showSuccess(`Quiz finished with ${score}%`)}
                                        onClose={() => setSelectedQuiz(null)}
                                    />
                                ) : activeTab === 'assignment' && selectedAssignment ? (
                                    <AssignmentPortal 
                                        assignment={selectedAssignment}
                                        onSubmit={async (_data) => {
                                            showSuccess('Assignment submitted for review!');
                                            setSelectedAssignment(null);
                                        }}
                                        isSubmitting={false}
                                    />
                                ) : activeTab === 'quiz' ? (
                                                    <div className="space-y-2">
                                                        {(!selectedCourse.quizzes || selectedCourse.quizzes.length === 0) ? (
                                                            <p className="text-center py-4 text-slate-500 text-xs">No quizzes available.</p>
                                                        ) : (
                                                            selectedCourse.quizzes.map((q: any, i: number) => (
                                                                <button 
                                                                    key={q._id}
                                                                    onClick={() => setSelectedQuiz(q)}
                                                                    className="w-full text-left p-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:border-blue-500 text-white text-sm flex items-center justify-between"
                                                                >
                                                                    <span>{i + 1}. {q.title}</span>
                                                                    <ChevronRight className="h-4 w-4 text-slate-500" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                ) : activeTab === 'assignment' ? (
                                                    <div className="space-y-2">
                                                        {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
                                                            <p className="text-center py-4 text-slate-500 text-xs">No assignments found.</p>
                                                        ) : (
                                                            selectedCourse.assignments.map((a: any, i: number) => (
                                                                <button 
                                                                    key={a._id}
                                                                    onClick={() => setSelectedAssignment(a)}
                                                                    className="w-full text-left p-3 rounded-xl border border-slate-700 bg-slate-900/40 hover:border-blue-500 text-white text-sm flex items-center justify-between"
                                                                >
                                                                    <span>{i + 1}. {a.title}</span>
                                                                    <ChevronRight className="h-4 w-4 text-slate-500" />
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                ) : activeTab === 'resources' ? (
                                                    <div className="space-y-4">
                                                        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-blue-400" /> Lesson Resources
                                                            </h4>
                                                            <p className="text-xs text-slate-400 mb-4">Downloadable materials for the current selected lesson.</p>
                                                            
                                                            {(!selectedCourse.lessons?.[selectedLessonIndex]?.resources || selectedCourse.lessons[selectedLessonIndex].resources.length === 0) ? (
                                                                <p className="text-center py-4 text-slate-500 text-xs italic">No specific resources for this lesson.</p>
                                                            ) : !(selectedCourse.hasFullAccess || selectedLessonIndex < selectedCourse.freeVideosLimit) ? (
                                                                <div className="p-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                                                                    <Lock className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-50" />
                                                                    <p className="text-xs text-slate-400">Resources are locked for this lesson. Enroll to gain full access.</p>
                                                                </div>
                                                            ) : (
                                                                <div className="grid gap-2">
                                                                    {selectedCourse.lessons[selectedLessonIndex].resources.map((res: any, idx: number) => (
                                                                        <a 
                                                                            key={idx}
                                                                            href={res.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 transition-all group"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
                                                                                    <FileText className="h-4 w-4" />
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-sm font-medium text-white block">{res.title}</span>
                                                                                    <span className="text-[10px] text-slate-500 uppercase">{res.type} document</span>
                                                                                </div>
                                                                            </div>
                                                                            <Download className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {selectedCourse.resourceUrl && (
                                                            <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/40">
                                                                <h4 className="text-sm font-bold text-white mb-2">Main Course Content</h4>
                                                                <a 
                                                                    href={selectedCourse.resourceUrl}
                                                                    className="text-xs text-blue-400 hover:underline break-all"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {selectedCourse.resourceUrl}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-8 lg:grid-cols-12">
                                                        <div className="space-y-4 lg:col-span-8">
                                                            <div>
                                                                <h3 className="text-xl font-black tracking-tight text-white">
                                                                    {selectedCourse.title}
                                                                </h3>
                                                                <p className="mt-1 text-sm text-slate-300">{selectedCourse.description}</p>
                                                            </div>
                                                            <div className="relative aspect-video overflow-hidden rounded-3xl border border-slate-800 bg-black shadow-2xl">
                                                                {toEmbedUrl(selectedCourse, selectedLessonIndex) ? (
                                                                    <iframe
                                                                        className="h-full w-full min-h-[220px]"
                                                                        src={toEmbedUrl(selectedCourse, selectedLessonIndex)!}
                                                                        title={selectedCourse.title}
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                                        allowFullScreen
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-300">
                                                                        Video preview unavailable
                                                                    </div>
                                                                )}
                                                                {!selectedCourse.hasFullAccess &&
                                                                    !watchedPartOne[selectedCourse._id] && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 20 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-md"
                                                                        >
                                                                            <Lock className="mb-2 h-10 w-10 text-cyan-400" />
                                                                            <p className="text-xl font-bold tracking-wide text-white">
                                                                                Course Locked
                                                                            </p>
                                                                            <p className="mt-1 max-w-md px-6 text-center text-sm text-slate-300">
                                                                                Click below to instantly unlock and watch the first{' '}
                                                                                {selectedCourse.freeVideosLimit} lesson(s) for free,
                                                                                then enroll to proceed with the rest of the course!
                                                                            </p>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    markPartOneWatched(selectedCourse._id)
                                                                                }
                                                                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                                                                            >
                                                                                <PlayCircle className="h-5 w-5" />
                                                                                Watch Free Lessons
                                                                            </button>
                                                                        </motion.div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-4">
                                                            <section className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/40 shadow-xl">
                                                                <div className="border-b border-slate-700 bg-slate-800/60 px-4 py-4">
                                                                    <h2 className="flex items-center gap-2 text-lg font-black italic text-white">
                                                                        <BookOpen className="h-5 w-5 text-cyan-400" />
                                                                        Lesson Hierarchy
                                                                    </h2>
                                                                </div>
                                                                <div className="custom-scrollbar max-h-[min(70vh,560px)] overflow-y-auto p-2">
                                                                    {!selectedCourse.lessons ||
                                                                    selectedCourse.lessons.length === 0 ? (
                                                                        <div className="rounded-xl border border-slate-700/50 bg-slate-800/25 px-4 py-8 text-center text-slate-400">
                                                                            <Clock3 className="mx-auto mb-3 h-8 w-8 opacity-20" />
                                                                            No lessons available for this course yet.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {selectedCourse.lessons.map((lesson, index) => {
                                                                                const isFreePreview =
                                                                                    lesson.isFree === true || index === 0;
                                                                                const isUnlocked =
                                                                                    selectedCourse.hasFullAccess ||
                                                                                    isFreePreview;
                                                                                const isSelected =
                                                                                    selectedLessonIndex === index;
                                                                                return (
                                                                                    <button
                                                                                        key={
                                                                                            lesson._id ||
                                                                                            `lesson-${index}`
                                                                                        }
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            if (isUnlocked) {
                                                                                                setSelectedLessonIndex(
                                                                                                    index
                                                                                                );
                                                                                            }
                                                                                        }}
                                                                                        className={cn(
                                                                                            'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                                                                                            isSelected
                                                                                                ? 'border-cyan-500/30 bg-cyan-500/10'
                                                                                                : isUnlocked
                                                                                                  ? 'border-transparent hover:bg-slate-800/50'
                                                                                                  : 'cursor-not-allowed border-transparent opacity-60'
                                                                                        )}
                                                                                    >
                                                                                        <div
                                                                                            className={cn(
                                                                                                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-black',
                                                                                                isSelected
                                                                                                    ? 'bg-cyan-500 text-white'
                                                                                                    : 'bg-slate-800 text-slate-500'
                                                                                            )}
                                                                                        >
                                                                                            {index + 1}
                                                                                        </div>
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <p
                                                                                                className={cn(
                                                                                                    'truncate text-sm font-bold',
                                                                                                    isSelected
                                                                                                        ? 'text-white'
                                                                                                        : 'text-slate-400'
                                                                                                )}
                                                                                            >
                                                                                                {lesson.title}
                                                                                            </p>
                                                                                            <div className="mt-1 flex items-center gap-2">
                                                                                                {isFreePreview ? (
                                                                                                    <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter text-emerald-400/80">
                                                                                                        Free Preview
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="rounded bg-rose-400/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter text-rose-400/80">
                                                                                                        Premium Part
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        {isUnlocked ? (
                                                                                            <Play
                                                                                                className={cn(
                                                                                                    'h-4 w-4 flex-shrink-0',
                                                                                                    isSelected
                                                                                                        ? 'text-cyan-400'
                                                                                                        : 'text-slate-600'
                                                                                                )}
                                                                                            />
                                                                                        ) : (
                                                                                            <Lock className="h-4 w-4 text-slate-600" />
                                                                                        )}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                    {!selectedCourse.hasFullAccess && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            whileInView={{ opacity: 1, y: 0 }}
                                                                            className="mt-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-4 backdrop-blur-sm"
                                                                        >
                                                                            <div className="flex gap-3">
                                                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/20">
                                                                                    <Lock className="h-5 w-5 text-amber-400" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="mb-1 text-sm font-bold text-amber-200">
                                                                                        {selectedCourse.enrollmentStatus ===
                                                                                        'pending'
                                                                                            ? 'Approval Pending'
                                                                                            : 'Unlock All Lessons'}
                                                                                    </p>
                                                                                    <p className="text-xs leading-relaxed text-amber-100/70">
                                                                                        {selectedCourse.enrollmentStatus ===
                                                                                        'pending'
                                                                                            ? 'Your payment record is being verified. You will get full access soon!'
                                                                                            : `Enjoy Part 1 for free! Enroll now to unlock ${selectedCourse.lessons?.length ? selectedCourse.lessons.length - 1 : 'the remaining'} expert-led sessions.`}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </section>
                                                        </div>
                                                    </div>
                                                )}
                            </div>
                        </div>
                    </motion.section>
                    )}

                        <div className="rounded-2xl border border-slate-700 bg-[#112240] overflow-hidden">
                            {!selectedCourse ? (
                                <div className="p-12 text-center text-slate-500">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">Select a course to open community discussion.</p>
                                </div>
                            ) : !canViewDiscussion ? (
                                <div className="p-12 text-center text-slate-500">
                                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-sm">Discussion unlocks after enrollment approval.</p>
                                </div>
                            ) : (
                                <CourseForum 
                                    courseId={selectedCourse._id} 
                                    currentUserId={user?.id || ''} 
                                />
                            )}
                        </div>

                        {selectedCourse && (
                            <CourseReviews
                                courseId={selectedCourse._id}
                                hasFullAccess={selectedCourse.hasFullAccess}
                                isInstructorOrAdmin={isModerator}
                                apiUrl={API_URL}
                            />
                        )}
                </div>
            </div>
        </div>
    );
};

export default BrowseCourses;
