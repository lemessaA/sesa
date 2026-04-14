import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/toast';
import axios from 'axios';
import { CheckCircle, XCircle, Filter, BookOpen, Users, Eye, ImageIcon, ExternalLink, CreditCard, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getYoutubeEmbedSrc, isLikelyDirectVideoFileUrl } from '../../utils/youtube';

interface CourseApproval {
    _id: string;
    title: string;
    instructor: {
        _id: string;
        name: string;
    };
    category?: {
        name: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

type TabType = 'enrollments' | 'courses';

const Approvals: React.FC = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('enrollments');
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [courses, setCourses] = useState<CourseApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedCoursePreview, setSelectedCoursePreview] = useState<any | null>(null);
    const [selectedPaymentPreview, setSelectedPaymentPreview] = useState<{
        proofUrl: string;
        enrollmentId: string;
        paymentId?: string;
        studentName?: string;
        courseTitle?: string;
    } | null>(null);
    const [previewActionLoading, setPreviewActionLoading] = useState<'approve' | 'reject' | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const coursePlayerWrapRef = useRef<HTMLDivElement>(null);

    const toggleCoursePlayerFullscreen = useCallback(() => {
        const el = coursePlayerWrapRef.current;
        if (!el) return;
        if (document.fullscreenElement === el) {
            void document.exitFullscreen();
        } else {
            void el.requestFullscreen?.();
        }
    }, []);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // URL construction helper function to build full API URLs from relative paths
    const constructImageUrl = (relativePath: string): string => {
        if (!relativePath || relativePath === '/') return '';
        if (relativePath.startsWith('http')) return relativePath; // Already full URL
        
        // Remove leading slash if present to avoid double slashes
        const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
        
        // Handle empty path after cleaning
        if (!cleanPath) return '';
        
        // Encode URI components to handle special characters like spaces
        const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        
        return `${API_URL}/${encodedPath}`;
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Keyboard shortcuts for payment preview modal
    useEffect(() => {
        if (!selectedPaymentPreview) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                handleApproveEnrollment(selectedPaymentPreview.enrollmentId, selectedPaymentPreview.paymentId);
                setSelectedPaymentPreview(null);
            } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                handleRejectEnrollment(selectedPaymentPreview.enrollmentId, selectedPaymentPreview.paymentId);
                setSelectedPaymentPreview(null);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setSelectedPaymentPreview(null);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [selectedPaymentPreview]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'courses') {
                const res = await axios.get(`${API_URL}/course-management/admin/courses/pending-review`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data);
            } else {
                const res = await axios.get(`${API_URL}/course-management/admin/enrollments/verification`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Enrollment data received:', res.data); // Debug logging
                setEnrollments(res.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            showError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveEnrollment = async (enrollmentId: string, paymentId?: string) => {
        try {
            setPreviewActionLoading('approve');
            if (paymentId) {
                await axios.patch(
                    `${API_URL}/payments/${paymentId}/verify`,
                    { status: 'completed' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Fallback for enrollments without explicit payment record
                await axios.put(
                    `${API_URL}/course-management/admin/enrollments/${enrollmentId}/verify`,
                    { status: 'approved' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            showSuccess('Enrollment verified and access granted');
            fetchData();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to verify enrollment');
        } finally {
            setPreviewActionLoading(null);
        }
    };

    const handleRejectEnrollment = async (enrollmentId: string, paymentId?: string) => {
        const comment = window.prompt("Enter a reason for rejection (optional):");
        if (comment === null) return;

        try {
            setPreviewActionLoading('reject');
            if (paymentId) {
                await axios.patch(
                    `${API_URL}/payments/${paymentId}/verify`,
                    { status: 'failed', adminComment: comment },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.put(
                    `${API_URL}/course-management/admin/enrollments/${enrollmentId}/reject`,
                    { adminComment: comment },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            showSuccess('Enrollment rejected');
            fetchData();
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to reject enrollment');
        } finally {
            setPreviewActionLoading(null);
        }
    };

    const handleCourseStatusUpdate = async (courseId: string, decision: 'accept' | 'reject') => {
        let comment = undefined;
        if (decision === 'reject') {
            const promptComment = window.prompt("Enter a reason for course rejection (optional):");
            if (promptComment === null) return;
            comment = promptComment;
        }

        try {
            await axios.put(
                `${API_URL}/course-management/admin/courses/${courseId}/review`,
                { decision, adminComment: comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess(`Course ${decision === 'accept' ? 'approved' : 'rejected'} successfully`);
            fetchData();
        } catch (err: any) {
            showError(err.response?.data?.message || `Failed to update course status`);
        }
    };

    const filteredItems = activeTab === 'enrollments' 
        ? enrollments.filter(item => statusFilter === 'all' || item.enrollment.status === statusFilter)
        : courses.filter(c => statusFilter === 'all' || c.status === statusFilter);

    const stats = {
        total: activeTab === 'enrollments' ? enrollments.length : courses.length,
        pending: (activeTab === 'enrollments' ? enrollments : courses).filter((i: any) => (activeTab === 'enrollments' ? i.enrollment.status : i.status) === 'pending').length,
        approved: (activeTab === 'enrollments' ? enrollments : courses).filter((i: any) => (activeTab === 'enrollments' ? i.enrollment.status : i.status) === 'approved').length,
        rejected: (activeTab === 'enrollments' ? enrollments : courses).filter((i: any) => (activeTab === 'enrollments' ? i.enrollment.status : i.status) === 'rejected').length
    };

    return (
        <div className="min-h-screen space-y-6 overflow-x-clip bg-[#050b17] p-3 sm:p-4 md:space-y-8 md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-[#60a5fa]" />
                    <h1 className="text-3xl font-bold tracking-tight text-white">Approvals</h1>
                </div>

                <div className="flex w-full max-w-full overflow-x-auto rounded-xl border border-[#14305f] bg-[#0a1630] p-1 md:w-fit">
                    <button
                        onClick={() => setActiveTab('enrollments')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'enrollments' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Student Enrollments
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === 'courses' ? 'bg-[#3b82f6] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        Course Submissions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {[
                    { label: 'Total Requests', value: stats.total, color: 'text-white' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
                    { label: 'Approved', value: stats.approved, color: 'text-emerald-400' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-rose-400' },
                ].map((stat, i) => (
                    <div key={i} className="rounded-2xl border border-[#14305f] bg-[#0a1630] p-4 sm:p-6">
                        <p className={`text-2xl font-bold sm:text-3xl ${stat.color}`}>{stat.value}</p>
                        <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 bg-[#0a1630] border border-[#14305f] rounded-xl p-4 w-fit">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-slate-300 text-sm font-medium focus:outline-none focus:ring-0 cursor-pointer"
                >
                    <option value="pending" className="bg-slate-800">Pending Only</option>
                    <option value="all" className="bg-slate-800">All Status</option>
                    <option value="approved" className="bg-slate-800">Approved</option>
                    <option value="rejected" className="bg-slate-800">Rejected</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#14305f] bg-[#0a1630]">
                {loading ? (
                    <div className="text-center py-12 text-slate-400 animate-pulse">Scanning records...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 border border-slate-700 border-dashed m-4 rounded-xl">
                        {statusFilter === 'pending' ? 'No pending requests currently.' : 'No records found.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[980px] w-full text-left">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {activeTab === 'enrollments' ? 'Student' : 'Course Details'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {activeTab === 'enrollments' ? 'Target Course' : 'Instructor'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status & Verification</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredItems.map((item: any, index: number) => {
                                    const isEnrollment = activeTab === 'enrollments';
                                    const data = isEnrollment ? item.enrollment : item;
                                    const paymentMeta = isEnrollment ? item.paymentMetadata : null;
                                    
                                    // Debug logging for enrollment items
                                    if (isEnrollment) {
                                        console.log(`Rendering enrollment ${index}:`, {
                                            enrollmentId: data._id,
                                            paymentMeta,
                                            hasPayment: !!item.payment,
                                            paymentProofUrl: item.payment?.proofUrl,
                                            paymentReceiptImage: item.payment?.receiptImage
                                        });
                                    }
                                    
                                    const title1 = isEnrollment ? data.user?.name : data.title;
                                    const subtitle1 = isEnrollment ? data.user?.email : (data.category?.name || 'Uncategorized');
                                    const title2 = isEnrollment ? data.course?.title : data.instructor?.name;
                                    const dateField = isEnrollment ? data.requestedAt : data.createdAt;
                                    const previewVideoUrl = !isEnrollment
                                        ? (data.previewVideoUrl || data.lessons?.[0]?.videoUrl || '')
                                        : '';

                                    return (
                                        <tr key={index} className="hover:bg-slate-800/60 transition-colors group">
                                            <td className="min-w-[200px] px-4 py-4 sm:px-6">
                                                <p className="font-semibold text-slate-200">{title1}</p>
                                                <p className="text-sm text-slate-400 mt-0.5">{subtitle1}</p>
                                            </td>
                                            <td className="px-4 py-4 text-slate-300 sm:px-6">
                                                <div className="font-medium">{title2}</div>
                                                {isEnrollment && data.course?.price && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded-full">ETB {data.course.price}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 sm:px-6">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {data.status === 'approved' && (
                                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded-full">Approved</span>
                                                        )}
                                                        {data.status === 'pending' && (
                                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium rounded-full">Pending</span>
                                                        )}
                                                        {data.status === 'rejected' && (
                                                            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium rounded-full">Rejected</span>
                                                        )}
                                                    </div>
                                                    
                                                    {isEnrollment && paymentMeta && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                                <CreditCard className="w-3 h-3" />
                                                                <span className="uppercase font-bold tracking-wider">{paymentMeta.method}</span>
                                                            </div>
                                                            {paymentMeta.transactionId && (
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                                                                    ID: {paymentMeta.transactionId}
                                                                </div>
                                                            )}
                                                            {(paymentMeta?.proofUrl || item.payment?.receiptImage || item.payment?.proofUrl) && (
                                                                <button
                                                                    onClick={() =>
                                                                        setSelectedPaymentPreview({
                                                                            proofUrl: paymentMeta?.proofUrl || item.payment?.receiptImage || item.payment?.proofUrl,
                                                                            enrollmentId: data._id,
                                                                            paymentId: item.payment?._id,
                                                                            studentName: data.user?.name,
                                                                            courseTitle: data.course?.title,
                                                                        })
                                                                    }
                                                                    className="mt-1 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors w-fit font-bold hover:bg-blue-500/10 px-2 py-1 rounded-lg"
                                                                >
                                                                    <div className="relative">
                                                                        <img
                                                                            src={constructImageUrl(paymentMeta?.proofUrl || item.payment?.receiptImage || item.payment?.proofUrl || '')}
                                                                            alt="Receipt thumbnail"
                                                                            className="h-10 w-14 rounded-md border border-[#1d3f7a] object-cover bg-slate-800"
                                                                            onError={(e) => {
                                                                                // Enhanced fallback with better error handling
                                                                                const img = e.target as HTMLImageElement;
                                                                                if (!img.dataset.fallbackAttempted) {
                                                                                    img.dataset.fallbackAttempted = 'true';
                                                                                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA1NiA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjQwIiBmaWxsPSIjMUYyOTM3IiBzdHJva2U9IiM0NzU1NjkiIHN0cm9rZS13aWR0aD0iMSIvPgo8cGF0aCBkPSJNMjggMjBMMjIgMjZIMzRMMjggMjBaIiBmaWxsPSIjNjM3NDhBIi8+CjxjaXJjbGUgY3g9IjIzIiBjeT0iMTYiIHI9IjIiIGZpbGw9IiM2Mzc0OEEiLz4KPC9zdmc+';
                                                                                    img.classList.add('opacity-60');
                                                                                    img.title = 'Failed to load receipt image';
                                                                                }
                                                                            }}
                                                                        />
                                                                        <div className="absolute inset-0 bg-blue-500/20 opacity-0 hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                                                            <Eye className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    </div>
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <ImageIcon className="w-3.5 h-3.5" />
                                                                        Preview Receipt
                                                                    </span>
                                                                </button>
                                                            )}
                                                            {!(paymentMeta?.proofUrl || item.payment?.receiptImage || item.payment?.proofUrl) && paymentMeta?.transactionId && (
                                                                <div className="mt-1 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                                    <span>No receipt uploaded</span>
                                                                </div>
                                                            )}
                                                            {(paymentMeta?.proofUrl || item.payment?.receiptImage || item.payment?.proofUrl) && (
                                                                <div className="text-[10px] font-semibold text-slate-500">
                                                                    Source: {item.payment?.receiptImage || item.payment?.proofUrl ? 'payment record' : 'enrollment record'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-400 sm:px-6">
                                                {new Date(dateField).toLocaleDateString()}
                                                <p className="text-[10px] opacity-50">{new Date(dateField).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right sm:px-6">
                                                {data.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity md:opacity-0 group-hover:opacity-100">
                                                        {!isEnrollment && (
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedCoursePreview({
                                                                        ...data,
                                                                        previewVideoUrl,
                                                                    })
                                                                }
                                                                className="p-2 bg-slate-700/50 text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors border border-[#1d3f7a]"
                                                                title="Preview Course"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => 
                                                                isEnrollment 
                                                                ? handleApproveEnrollment(data._id, item.payment?._id)
                                                                : handleCourseStatusUpdate(data._id, 'accept')
                                                            }
                                                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => 
                                                                isEnrollment 
                                                                ? handleRejectEnrollment(data._id, item.payment?._id)
                                                                : handleCourseStatusUpdate(data._id, 'reject')
                                                            }
                                                            className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedCoursePreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="w-full max-w-5xl overflow-hidden rounded-[1.25rem] border border-[#1d3f7a] bg-[#0a1630]/95 shadow-2xl backdrop-blur-2xl sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#14305f] px-4 py-3 sm:items-center sm:px-6 sm:py-4">
                            <div>
                                <h3 className="text-xl font-black text-white">{selectedCoursePreview.title}</h3>
                                <p className="text-sm text-slate-300">
                                    Instructor: {selectedCoursePreview.instructor?.name || 'Unknown'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedCoursePreview(null)}
                                className="rounded-xl border border-[#1d3f7a] bg-black/30 p-2 text-slate-200 transition hover:border-[#60a5fa] hover:text-white"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-3 sm:p-4 md:p-5">
                            {(() => {
                                const previewUrlRaw = String(
                                    selectedCoursePreview.previewVideoUrl ||
                                        selectedCoursePreview.lessons?.[0]?.videoUrl ||
                                        ''
                                ).trim();
                                const youtubeEmbed = getYoutubeEmbedSrc(
                                    previewUrlRaw || null,
                                    selectedCoursePreview.youtubeVideoId
                                );
                                const directFile =
                                    previewUrlRaw && isLikelyDirectVideoFileUrl(previewUrlRaw);
                                const externalOnly =
                                    previewUrlRaw &&
                                    /^https?:\/\//i.test(previewUrlRaw) &&
                                    !youtubeEmbed &&
                                    !directFile;

                                return (
                                    <div className="space-y-3">
                                        <div
                                            ref={coursePlayerWrapRef}
                                            className="overflow-hidden rounded-2xl border border-[#14305f] bg-[#050b17]"
                                        >
                                            {youtubeEmbed ? (
                                                <iframe
                                                    title="Course preview"
                                                    className="aspect-video min-h-[40vh] w-full bg-black"
                                                    src={youtubeEmbed}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                    allowFullScreen
                                                />
                                            ) : directFile && previewUrlRaw ? (
                                                <video
                                                    controls
                                                    controlsList="nodownload noplaybackrate"
                                                    className="aspect-video min-h-[40vh] w-full bg-black object-contain"
                                                    src={previewUrlRaw}
                                                />
                                            ) : externalOnly ? (
                                                <div className="flex min-h-[32vh] flex-col items-center justify-center gap-4 p-6 text-center text-slate-300 sm:min-h-[38vh] md:min-h-[45vh]">
                                                    <p className="text-sm">
                                                        Preview is not a YouTube embed or direct video file. Open the
                                                        link to review.
                                                    </p>
                                                    <a
                                                        href={previewUrlRaw}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-xl border border-[#1d3f7a] bg-black/40 px-4 py-2 text-sm font-semibold text-cyan-300 hover:border-[#60a5fa]"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        Open preview URL
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="flex min-h-[32vh] items-center justify-center p-4 text-center text-slate-300 sm:min-h-[38vh] md:min-h-[50vh] md:p-8">
                                                    No preview video found for this course. You can still open the
                                                    detailed course preview page.
                                                </div>
                                            )}
                                        </div>
                                        {(youtubeEmbed || directFile) && (
                                            <button
                                                type="button"
                                                onClick={toggleCoursePlayerFullscreen}
                                                className="inline-flex items-center gap-2 rounded-xl border border-[#1d3f7a] bg-black/30 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#60a5fa]"
                                            >
                                                <Maximize2 className="h-4 w-4" />
                                                Fullscreen player
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="mt-4 rounded-2xl border border-[#14305f] bg-[#0a1630] p-4 text-slate-200">
                                <p className="text-sm leading-relaxed">{selectedCoursePreview.description}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#14305f] px-4 py-3 sm:px-6 sm:py-4">
                            <Link
                                to={`/admin/courses/${selectedCoursePreview._id}/preview`}
                                className="inline-flex items-center gap-2 rounded-xl border border-[#1d3f7a] bg-black/30 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#60a5fa]"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Full Course Preview
                            </Link>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCourseStatusUpdate(selectedCoursePreview._id, 'reject')}
                                    className="rounded-xl border border-rose-500 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleCourseStatusUpdate(selectedCoursePreview._id, 'accept')}
                                    className="rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-white"
                                >
                                    Accept
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {selectedPaymentPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="w-full max-w-5xl overflow-hidden rounded-[1.25rem] border border-[#14305f] bg-[#0a1630] shadow-2xl sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-[#14305f] px-4 py-3 sm:items-center sm:px-6 sm:py-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-white">Receipt Verification</h3>
                                <div className="mt-1 space-y-1">
                                    <p className="text-sm text-slate-400">
                                        <span className="font-semibold text-slate-300">{selectedPaymentPreview.studentName || 'Student'}</span> · {selectedPaymentPreview.courseTitle || 'Course'}
                                    </p>
                                    {/* Find the enrollment data to show payment method and transaction ID */}
                                    {(() => {
                                        const enrollmentData = enrollments.find(e => e.enrollment._id === selectedPaymentPreview.enrollmentId);
                                        const paymentMeta = enrollmentData?.paymentMetadata;
                                        return paymentMeta && (
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                {paymentMeta.method && (
                                                    <span className="flex items-center gap-1">
                                                        <CreditCard className="w-3 h-3" />
                                                        {paymentMeta.method.toUpperCase()}
                                                    </span>
                                                )}
                                                {paymentMeta.transactionId && (
                                                    <span>ID: {paymentMeta.transactionId}</span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPaymentPreview(null)}
                                className="rounded-xl border border-[#1d3f7a] bg-[#050b17] p-2 text-slate-300 transition hover:border-[#60a5fa] hover:text-white"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="max-h-[65vh] overflow-auto bg-[#050b17] p-3 sm:p-4">
                            <div className="relative">
                                <img
                                    src={constructImageUrl(selectedPaymentPreview.proofUrl)}
                                    alt="Payment receipt preview"
                                    className="mx-auto max-h-[58vh] w-auto max-w-full rounded-2xl border border-slate-800 bg-slate-900"
                                    onError={(e) => {
                                        // Enhanced error handling for preview modal
                                        const img = e.target as HTMLImageElement;
                                        if (!img.dataset.fallbackAttempted) {
                                            img.dataset.fallbackAttempted = 'true';
                                            img.style.display = 'none';
                                            const errorDiv = img.nextElementSibling as HTMLElement;
                                            if (errorDiv) {
                                                errorDiv.style.display = 'flex';
                                                // Add the original URL to the error message for debugging
                                                const urlInfo = errorDiv.querySelector('.url-info');
                                                if (!urlInfo) {
                                                    const urlElement = document.createElement('p');
                                                    urlElement.className = 'url-info text-xs text-slate-500 mt-2 font-mono break-all';
                                                    urlElement.textContent = `Failed URL: ${img.src}`;
                                                    errorDiv.appendChild(urlElement);
                                                }
                                            }
                                        }
                                    }}
                                />
                                <div 
                                    className="hidden flex-col items-center justify-center min-h-[300px] text-slate-400 bg-slate-900 rounded-2xl border border-slate-800"
                                    style={{ display: 'none' }}
                                >
                                    <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                                    <p className="text-lg font-semibold mb-2">Unable to load image</p>
                                    <p className="text-sm text-center max-w-md">
                                        The receipt image could not be displayed. You can try opening it in a new tab using the "Open Full Size" button below.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#14305f] px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center gap-3">
                                <a
                                    href={constructImageUrl(selectedPaymentPreview.proofUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#1d3f7a] bg-[#050b17] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#60a5fa]"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open Full Size
                                </a>
                                <div className="hidden sm:block text-xs text-slate-500">
                                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">A</kbd> to approve, <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">R</kbd> to reject
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        handleRejectEnrollment(selectedPaymentPreview.enrollmentId, selectedPaymentPreview.paymentId);
                                        setSelectedPaymentPreview(null);
                                    }}
                                    disabled={previewActionLoading !== null}
                                    className="rounded-xl border border-rose-500 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {previewActionLoading === 'reject' && (
                                        <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    Reject
                                </button>
                                <button
                                    onClick={() => {
                                        handleApproveEnrollment(selectedPaymentPreview.enrollmentId, selectedPaymentPreview.paymentId);
                                        setSelectedPaymentPreview(null);
                                    }}
                                    disabled={previewActionLoading !== null}
                                    className="rounded-xl border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {previewActionLoading === 'approve' && (
                                        <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    Accept
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Approvals;
