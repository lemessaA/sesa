import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../utils/toast';
import { UserRole } from '../../types';

interface CourseReview {
    _id: string;
    userId: string;
    userName: string;
    userRole: string;
    rating: number;
    text: string;
    createdAt: string;
}

interface CourseReviewsProps {
    courseId: string;
    hasFullAccess: boolean;
    isInstructorOrAdmin: boolean;
    apiUrl: string;
}

const StarRating: React.FC<{ rating: number; setRating?: (val: number) => void }> = ({ rating, setRating }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={!setRating}
                    onClick={() => setRating?.(star)}
                    className={`focus:outline-none ${!setRating ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
                        }`}
                >
                    <Star
                        className={`h-5 w-5 ${star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-transparent text-slate-500 hover:text-amber-400'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

const CourseReviews: React.FC<CourseReviewsProps> = ({ courseId, hasFullAccess, isInstructorOrAdmin, apiUrl }) => {
    const { token, user } = useAuth();
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get<CourseReview[]>(`${apiUrl}/courses/${courseId}/reviews`);
            setReviews(response.data);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchReviews();
        }
    }, [courseId]);

    const submitReview = async () => {
        if (!token) return showError('Please login to leave a review');
        if (!reviewText.trim()) return showError('Review text is required');

        try {
            setIsSubmitting(true);
            await axios.post(
                `${apiUrl}/courses/${courseId}/reviews`,
                { rating, text: reviewText.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showSuccess('Review submitted successfully');
            setReviewText('');
            setRating(5);
            fetchReviews();
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteReview = async (reviewId: string) => {
        if (!token) return;
        try {
            await axios.delete(`${apiUrl}/courses/${courseId}/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showSuccess('Review deleted');
            setReviews(prev => prev.filter(r => r._id !== reviewId));
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to delete review');
        }
    };

    const averageRating = reviews.length
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
        : 0;

    const hasReviewed = reviews.some(r => r.userId === user?.id);
    const canReview = hasFullAccess && !hasReviewed && !isInstructorOrAdmin;

    return (
        <div className="rounded-2xl border border-slate-700 bg-[#112240] p-4 mt-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 font-semibold text-white">
                    <Star className="h-4 w-4 text-amber-400" />
                    Course Reviews
                </h2>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="font-bold text-amber-400">{averageRating}</span>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>({reviews.length})</span>
                    </div>
                )}
            </div>

            {canReview && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 rounded-xl border border-slate-600 bg-slate-800/50 p-4"
                >
                    <h3 className="mb-3 text-sm font-medium text-slate-200">Leave a Review</h3>
                    <div className="mb-3">
                        <StarRating rating={rating} setRating={setRating} />
                    </div>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell others what you think about this course..."
                        className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900/50 p-3 text-sm text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                        rows={3}
                    />
                    <button
                        onClick={submitReview}
                        disabled={isSubmitting || !reviewText.trim()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </motion.div>
            )}

            {hasReviewed && (
                <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    You have reviewed this course.
                </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {isLoading ? (
                    <p className="text-sm text-slate-400 h-20 flex items-center justify-center">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-sm text-slate-400">No reviews yet. Be the first to review!</p>
                ) : (
                    <AnimatePresence>
                        {reviews.map((review) => (
                            <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
                            >
                                <div className="mb-2 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-slate-200">{review.userName}</span>
                                            {review.userRole === UserRole.INSTRUCTOR && (
                                                <span className="flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-300">
                                                    <ShieldCheck className="h-3 w-3" /> Instructor
                                                </span>
                                            )}
                                        </div>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-xs text-slate-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                        {(isInstructorOrAdmin || user?.id === review.userId) && (
                                            <button
                                                onClick={() => deleteReview(review._id)}
                                                className="text-slate-500 hover:text-rose-400 transition-colors"
                                                title="Delete Review"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-300">{review.text}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default CourseReviews;
