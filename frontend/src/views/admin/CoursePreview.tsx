import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, Play, FileText, CheckCircle, XCircle, 
    BookOpen, Globe, Shield, AlertCircle, ExternalLink
} from 'lucide-react';
import { apiService } from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';
import { extractYoutubeVideoId } from '../../utils/youtube';

const CoursePreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<number>(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (id) fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const res = await apiService.admin.previewCourse(id!);
            const payload = res.data as { course?: any };
            setCourse(payload.course ?? res.data);
        } catch (err) {
            showError('Failed to load course preview');
            navigate('/admin/approvals');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (decision: 'accept' | 'reject') => {
        if (decision === 'reject' && !reviewComment.trim()) {
            showError('Please provide a reason for rejection');
            return;
        }

        try {
            setIsProcessing(true);
            await apiService.admin.reviewCourse(id!, decision, reviewComment);
            showSuccess(`Course ${decision === 'accept' ? 'approved' : 'rejected'} successfully`);
            navigate('/admin/approvals');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-medium">Loading premium preview...</p>
                </div>
            </div>
        );
    }

    if (!course) return null;

    const currentLesson = course.lessons?.[activeLesson];
    const lessonVideoUrl =
        typeof currentLesson?.videoUrl === 'string' ? currentLesson.videoUrl.trim() : '';
    const previewSource = String(course.previewVideoUrl || course.resourceUrl || '').trim();

    const embedId =
        extractYoutubeVideoId(lessonVideoUrl) ||
        (!course.lessons?.length ? extractYoutubeVideoId(previewSource) : null) ||
        course.youtubeVideoId ||
        null;

    const fallbackWatchUrl =
        !embedId &&
        (() => {
            if (lessonVideoUrl && /^https?:\/\//i.test(lessonVideoUrl)) return lessonVideoUrl;
            if (
                (!course.lessons?.length || !lessonVideoUrl) &&
                previewSource &&
                /^https?:\/\//i.test(previewSource)
            ) {
                return previewSource;
            }
            return null;
        })();

    return (
        <div className="min-h-screen bg-[#0a192f] text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all group"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-black uppercase tracking-widest text-cyan-400/80">Admin Course Review</span>
                            </div>
                            <h1 className="text-3xl font-black text-white italic tracking-tight">{course.title}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right mr-4 hidden sm:block">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Instructor</p>
                            <p className="font-bold text-white">{course.instructor?.name}</p>
                        </div>
                        <button 
                            onClick={() => handleReview('reject')}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl font-black transition-all"
                        >
                            <XCircle className="w-5 h-5" /> Reject
                        </button>
                        <button 
                            onClick={() => handleReview('accept')}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <CheckCircle className="w-5 h-5" /> Approve
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Main Content: Video & Details */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Video Player Placeholder */}
                        <div className="aspect-video bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                            {embedId ? (
                                <iframe
                                    className="h-full w-full"
                                    src={`https://www.youtube.com/embed/${embedId}`}
                                    title="Lesson Preview"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : fallbackWatchUrl ? (
                                <div className="relative z-10 flex max-w-lg flex-col items-center gap-4 px-6 text-center">
                                    <ExternalLink className="h-12 w-12 text-cyan-500/80" />
                                    <p className="text-sm font-semibold text-slate-300">
                                        This lesson uses a non-YouTube or unembeddable URL. Open it in a new tab to
                                        preview.
                                    </p>
                                    <a
                                        href={fallbackWatchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-xl bg-cyan-500/20 px-5 py-2.5 text-sm font-bold text-cyan-300 underline-offset-4 hover:underline"
                                    >
                                        Open video link
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
                                    <Play className="relative z-10 h-16 w-16 text-slate-700 transition-colors group-hover:text-cyan-500" />
                                    <p className="relative z-10 mt-4 font-bold text-slate-500">
                                        Video content missing or invalid ID
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Info Cards */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/30 p-6 rounded-3xl border border-slate-800"
                            >
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-cyan-400" />
                                    Course Description
                                </h3>
                                <p className="text-slate-300 leading-relaxed">{course.description}</p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-slate-800/30 p-6 rounded-3xl border border-slate-800"
                            >
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-purple-400" />
                                    Curriculum Overview
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Total Lessons</span>
                                        <span className="font-bold text-white">{course.lessons?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Category</span>
                                        <span className="font-bold text-cyan-400">{course.category?.name || 'General'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Grade Level</span>
                                        <span className="font-bold text-emerald-400">{course.gradeLevel || '9-12'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Price Points</span>
                                        <span className="font-bold text-white">${course.price || 0}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Rejection Comment Box */}
                        <div className="bg-slate-800/20 p-6 rounded-3xl border border-slate-700/50">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Internal Review Notes / Rejection Reason</label>
                            <textarea 
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                placeholder="Add specific feedback for the instructor or notes for other admins..."
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none h-32"
                            />
                        </div>
                    </div>

                    {/* Sidebar: Lesson List */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-slate-800/40 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-slate-700 bg-slate-800/60">
                                <h2 className="text-lg font-black text-white flex items-center gap-2 italic">
                                    <BookOpen className="w-5 h-5 text-cyan-400" />
                                    Lesson Hierarchy
                                </h2>
                            </div>
                            <div className="p-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {course.lessons?.map((lesson: any, index: number) => (
                                    <button 
                                        key={index}
                                        onClick={() => setActiveLesson(index)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                            activeLesson === index 
                                            ? 'bg-cyan-500/10 border border-cyan-500/30' 
                                            : 'hover:bg-slate-800/50 border border-transparent'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                            activeLesson === index ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className={`text-sm font-bold truncate ${activeLesson === index ? 'text-white' : 'text-slate-400'}`}>
                                                {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {index === 0 ? (
                                                    <span className="text-[10px] font-black uppercase text-emerald-400/80 tracking-tighter bg-emerald-400/10 px-1.5 py-0.5 rounded">Free Preview</span>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase text-rose-400/80 tracking-tighter bg-rose-400/10 px-1.5 py-0.5 rounded">Premium Part</span>
                                                )}
                                            </div>
                                        </div>
                                        {(extractYoutubeVideoId(lesson?.videoUrl) || lesson?.videoUrl) && (
                                            <Play
                                                className={`h-4 w-4 ${activeLesson === index ? 'text-cyan-400' : 'text-slate-600'}`}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] p-6 rounded-3xl border border-cyan-500/20 flex items-start gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-2xl">
                                <AlertCircle className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-sm uppercase tracking-wide italic">Compliance Check</h4>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                    Ensure the video content matches the description and adheres to the SESA Academy quality guidelines before approval.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePreview;
