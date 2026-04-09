// Enhanced Screenshot Review Component with Accept/Reject and Reason
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Eye, 
    EyeOff, 
    Download, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw,
    Flag,
    Calendar,
    User,
    Monitor,
    Clock,
    FileImage,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Shield,
    Smartphone,
    Globe,
    Loader,
    Maximize2,
    Minimize2
} from 'lucide-react';
import apiService from '../../utils/api';

interface ScreenshotReview {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentAvatar?: string;
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    imageUrl: string;
    thumbnailUrl?: string;
    fileSize: number;
    dimensions: {
        width: number;
        height: number;
    };
    uploadContext: {
        timestamp: number;
        deviceInfo: string;
        browser: string;
    };
    adminReview?: {
        reviewedBy: string;
        reviewedAt: Date;
        approved: boolean;
        feedback?: string;
        flagged: boolean;
        flagReason?: string;
    };
    status: 'uploaded' | 'reviewed' | 'approved' | 'flagged' | 'deleted';
    createdAt: Date;
}

const mapScreenshot = (item: any): ScreenshotReview => ({
    id: item._id,
    studentId: item.studentId?._id || '',
    studentName: item.studentId?.name || 'Student',
    studentEmail: item.studentId?.email || '',
    studentAvatar: item.studentId?.profileImage,
    courseId: item.courseId?._id || '',
    courseTitle: item.courseId?.title || 'Course',
    lessonId: item.lessonId?._id || '',
    lessonTitle: item.lessonId?.title || 'Lesson',
    imageUrl: apiService.videoWorkflow.getUploadUrl('screenshots', (item.imageUrl || '').split('/').pop() || ''),
    thumbnailUrl: undefined,
    fileSize: item.fileSize || 0,
    dimensions: item.dimensions || { width: 0, height: 0 },
    uploadContext: item.uploadContext || { timestamp: 0, deviceInfo: 'Unknown', browser: 'Unknown' },
    adminReview: item.adminReview ? {
        reviewedBy: item.adminReview.reviewedBy || 'Admin',
        reviewedAt: new Date(item.adminReview.reviewedAt),
        approved: !!item.adminReview.approved,
        feedback: item.adminReview.feedback,
        flagged: !!item.adminReview.flagged,
        flagReason: item.adminReview.flagReason
    } : undefined,
    status: item.status || 'uploaded',
    createdAt: new Date(item.createdAt),
});

const ScreenshotReview: React.FC = () => {
    const [screenshots, setScreenshots] = useState<ScreenshotReview[]>([]);
    const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'flag' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [flagReason, setFlagReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const response = await apiService.videoWorkflow.getScreenshotsForReview({ page: 1, limit: 50 });
                setScreenshots((response.data?.data || []).map(mapScreenshot));
            } catch (error) {
                console.error('Failed to fetch screenshots for review:', error);
                setScreenshots([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleScreenshotSelect = (screenshot: ScreenshotReview) => {
        setSelectedScreenshot(screenshot);
        setReviewAction(null);
        setFeedback('');
        setFlagReason('');
        setZoomLevel(1);
        setShowOriginal(false);
    };

    const handleReviewSubmit = async () => {
        if (!selectedScreenshot || !reviewAction) return;

        setIsProcessing(true);
        try {
            await apiService.videoWorkflow.reviewScreenshot(selectedScreenshot.id, {
                approved: reviewAction === 'approve',
                feedback: reviewAction === 'flag' ? flagReason : feedback,
                flagged: reviewAction === 'flag',
                flagReason: reviewAction === 'flag' ? flagReason : undefined
            });
            setScreenshots((prev) => prev.filter((s) => s.id !== selectedScreenshot.id));
            setSelectedScreenshot(null);
            setReviewAction(null);
            setFeedback('');
            setFlagReason('');
        } catch (error) {
            console.error('Failed to review screenshot:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
    };

    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDeviceIcon = (device: string) => {
        const icons = {
            'Windows': <Monitor className="w-4 h-4" />,
            'Mac': <Monitor className="w-4 h-4" />,
            'iPhone': <Smartphone className="w-4 h-4" />,
            'iPad': <Monitor className="w-4 h-4" />,
            'Android': <Smartphone className="w-4 h-4" />
        };
        return icons[device as keyof typeof icons] || <Monitor className="w-4 h-4" />;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            uploaded: 'from-blue-400 to-indigo-500',
            reviewed: 'from-yellow-400 to-orange-500',
            approved: 'from-green-400 to-emerald-500',
            flagged: 'from-red-400 to-rose-500',
            deleted: 'from-gray-400 to-gray-500'
        };
        return colors[status as keyof typeof colors] || 'from-gray-400 to-gray-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Loading screenshots for review...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Screenshot Review Center
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Review and approve student lesson screenshots
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Screenshot List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                <FileImage className="w-5 h-5 mr-2 text-blue-600" />
                                Pending Review ({screenshots.filter(s => s.status === 'uploaded').length})
                            </h2>
                            
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {screenshots.map((screenshot) => (
                                    <motion.div
                                        key={screenshot.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleScreenshotSelect(screenshot)}
                                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                                            selectedScreenshot?.id === screenshot.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <img
                                                src={screenshot.thumbnailUrl || screenshot.imageUrl}
                                                alt={screenshot.lessonTitle}
                                                className="w-20 h-15 rounded-lg object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                    {screenshot.lessonTitle}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    {screenshot.studentName}
                                                </p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                                                    <span>{formatFileSize(screenshot.fileSize)}</span>
                                                    <span>•</span>
                                                    <span>{screenshot.dimensions.width}×{screenshot.dimensions.height}</span>
                                                    <span>•</span>
                                                    <span>{formatTime(screenshot.uploadContext.timestamp)}</span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor(screenshot.status)}`}>
                                                        {screenshot.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Screenshot Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        {selectedScreenshot ? (
                            <div className="space-y-6">
                                {/* Image Preview */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                                    <div className="relative bg-gray-100 dark:bg-gray-900">
                                        {/* Zoom Controls */}
                                        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                                            <button
                                                onClick={handleZoomOut}
                                                className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <ZoomOut className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                            </button>
                                            <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {Math.round(zoomLevel * 100)}%
                                            </span>
                                            <button
                                                onClick={handleZoomIn}
                                                className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                            </button>
                                            <button
                                                onClick={handleResetZoom}
                                                className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                                            </button>
                                            <button
                                                onClick={handleFullscreen}
                                                className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                            >
                                                {isFullscreen ? <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                                            </button>
                                        </div>
                                        
                                        {/* Image */}
                                        <div className="overflow-auto" style={{ maxHeight: isFullscreen ? '80vh' : '400px' }}>
                                            <img
                                                src={showOriginal ? selectedScreenshot.imageUrl : selectedScreenshot.thumbnailUrl || selectedScreenshot.imageUrl}
                                                alt={selectedScreenshot.lessonTitle}
                                                className="mx-auto transition-transform duration-300"
                                                style={{ transform: `scale(${zoomLevel})` }}
                                            />
                                        </div>
                                        
                                        {/* Toggle Original/Thumbnail */}
                                        {selectedScreenshot.thumbnailUrl && (
                                            <div className="absolute bottom-4 left-4">
                                                <button
                                                    onClick={() => setShowOriginal(!showOriginal)}
                                                    className="px-3 py-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                                                >
                                                    {showOriginal ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                                    {showOriginal ? 'Show Thumbnail' : 'Show Original'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Screenshot Info */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                        <FileImage className="w-5 h-5 mr-2 text-blue-600" />
                                        Screenshot Information
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-4">
                                                <img
                                                    src={selectedScreenshot.studentAvatar || 'https://via.placeholder.com/50?text=User'}
                                                    alt={selectedScreenshot.studentName}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                                                        {selectedScreenshot.studentName}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {selectedScreenshot.studentEmail}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Lesson</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {selectedScreenshot.lessonTitle}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Course</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {selectedScreenshot.courseTitle}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Timestamp</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {formatTime(selectedScreenshot.uploadContext.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Dimensions</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {selectedScreenshot.dimensions.width}×{selectedScreenshot.dimensions.height}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">File Size</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {formatFileSize(selectedScreenshot.fileSize)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Device</span>
                                                    <div className="flex items-center">
                                                        {getDeviceIcon(selectedScreenshot.uploadContext.deviceInfo)}
                                                        <span className="ml-2 text-gray-800 dark:text-gray-100">
                                                            {selectedScreenshot.uploadContext.deviceInfo}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Browser</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-100">
                                                        {selectedScreenshot.uploadContext.browser}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Actions */}
                                {selectedScreenshot.status === 'uploaded' && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                            Review Actions
                                        </h3>
                                        
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setReviewAction('approve')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'approve'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                                                }`}
                                            >
                                                <ThumbsUp className="w-5 h-5 mb-2" />
                                                Approve
                                            </motion.button>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setReviewAction('reject')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'reject'
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                                                }`}
                                            >
                                                <ThumbsDown className="w-5 h-5 mb-2" />
                                                Reject
                                            </motion.button>
                                            
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setReviewAction('flag')}
                                                className={`p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'flag'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400'
                                                }`}
                                            >
                                                <Flag className="w-5 h-5 mb-2" />
                                                Flag
                                            </motion.button>
                                        </div>
                                        
                                        {reviewAction && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-4"
                                            >
                                                {reviewAction === 'flag' ? (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Flag Reason (Required)
                                                        </label>
                                                        <select
                                                            value={flagReason}
                                                            onChange={(e) => setFlagReason(e.target.value)}
                                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-300"
                                                        >
                                                            <option value="">Select a reason...</option>
                                                            <option value="inappropriate">Inappropriate Content</option>
                                                            <option value="copyright">Copyright Violation</option>
                                                            <option value="quality">Poor Quality</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Feedback {reviewAction === 'reject' ? '(Required)' : '(Optional)'}
                                                        </label>
                                                        <textarea
                                                            value={feedback}
                                                            onChange={(e) => setFeedback(e.target.value)}
                                                            placeholder={reviewAction === 'reject' 
                                                                ? 'Please provide reason for rejection...' 
                                                                : 'Add any comments or suggestions...'}
                                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-300"
                                                            rows={4}
                                                        />
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                        
                                        {reviewAction && (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleReviewSubmit}
                                                disabled={isProcessing || (reviewAction === 'reject' && !feedback.trim()) || (reviewAction === 'flag' && !flagReason)}
                                                className={`w-full p-4 rounded-xl font-semibold transition-all duration-300 ${
                                                    reviewAction === 'approve'
                                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                                                        : reviewAction === 'reject'
                                                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                                                        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                                                } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        {reviewAction === 'approve' ? (
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                        ) : reviewAction === 'reject' ? (
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                        ) : (
                                                            <Flag className="w-5 h-5 mr-2" />
                                                        )}
                                                        {reviewAction === 'approve' ? 'Approve Screenshot' : reviewAction === 'reject' ? 'Reject Screenshot' : 'Flag Screenshot'}
                                                    </>
                                                )}
                                            </motion.button>
                                        )}
                                    </div>
                                )}

                                {/* Existing Review */}
                                {selectedScreenshot.adminReview && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                                            <Shield className="w-5 h-5 mr-2 text-purple-600" />
                                            Previous Review
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Reviewed By</span>
                                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedScreenshot.adminReview.reviewedBy}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Reviewed At</span>
                                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                                    {selectedScreenshot.adminReview.reviewedAt.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Decision</span>
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    selectedScreenshot.adminReview.approved
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                }`}>
                                                    {selectedScreenshot.adminReview.approved ? (
                                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 inline mr-1" />
                                                    )}
                                                    {selectedScreenshot.adminReview.approved ? 'Approved' : 'Rejected'}
                                                </div>
                                            </div>
                                            {selectedScreenshot.adminReview.feedback && (
                                                <div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Feedback</span>
                                                    <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                                                        {selectedScreenshot.adminReview.feedback}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                                <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                    No Screenshot Selected
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Select a screenshot from the list to review
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ScreenshotReview;
