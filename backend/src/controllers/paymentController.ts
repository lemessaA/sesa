import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import mongoose from 'mongoose';
import { createNotification } from '../models/Notification.js';
import { notifyUser } from '../utils/socket.js';
import { GamificationService } from '../services/gamificationService.js';

// Create payment intent
export const createPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, paymentMethod, amount } = req.body;
        const userId = req.user!.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            user: userId,
            course: courseId,
            status: 'approved'
        });

        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        // Create payment record
        const payment = new Payment({
            user: userId,
            course: courseId,
            amount: amount || course.price,
            paymentMethod,
            status: 'pending',
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        await payment.save();

        res.status(201).json({
            message: 'Payment initiated',
            payment,
            clientSecret: payment.transactionId // In real app, this would be Stripe client secret
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Confirm payment and enroll user
export const confirmPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user!.id;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update payment status
        payment.status = 'completed';
        payment.paymentDate = new Date();
        await payment.save();

        // Auto-approve enrollment after successful payment
        let enrollment = await Enrollment.findOne({
            user: userId,
            course: payment.course
        });

        if (!enrollment) {
            enrollment = new Enrollment({
                user: userId,
                course: payment.course,
                status: 'approved'
            });
        } else {
            enrollment.status = 'approved';
        }

        await enrollment.save();

        // Update course enrollment
        const course = await Course.findById(payment.course);
        if (course) {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            if (!course.enrolledStudents.some(id => id.toString() === userId)) {
                course.enrolledStudents.push(userObjectId);
            }

            const existingStudent = course.students.find(s => s.studentId.toString() === userId);
            if (existingStudent) {
                existingStudent.status = 'approved';
                existingStudent.approvedAt = new Date();
            } else {
                course.students.push({
                    studentId: userObjectId,
                    status: 'approved',
                    enrolledAt: new Date(),
                    approvedAt: new Date()
                });
            }

            await course.save();
        }

        res.json({
            message: 'Payment confirmed and enrollment approved',
            payment,
            enrollment
        });
    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user payments
export const getUserPayments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const payments = await Payment.find({ user: userId })
            .populate('course', 'title price thumbnailUrl')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Get user payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all payments (admin only)
export const getAllPayments = async (req: AuthRequest, res: Response) => {
    try {
        const { status, startDate, endDate } = req.query;
        
        const filter: any = {};
        if (status) filter.status = status;
        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) filter.paymentDate.$gte = new Date(startDate as string);
            if (endDate) filter.paymentDate.$lte = new Date(endDate as string);
        }

        const payments = await Payment.find(filter)
            .populate('user', 'name email')
            .populate('course', 'title price')
            .sort({ createdAt: -1 });

        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            payments,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Get all payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Refund payment (admin only)
export const refundPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ message: 'Only completed payments can be refunded' });
        }

        payment.status = 'refunded';
        await payment.save();

        // Remove enrollment
        await Enrollment.findOneAndUpdate(
            { user: payment.user, course: payment.course },
            { status: 'rejected' }
        );

        res.json({ message: 'Payment refunded successfully', payment });
    } catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   POST api/payments/:paymentId/upload-proof
// @desc    Upload screenshot of payment (Student)
export const uploadProof = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user!.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        payment.receiptImage = `/uploads/proofs/${req.file.filename}`;
        payment.status = 'pending'; // Ensure it's pending for admin review
        await payment.save();

        res.json({ 
            message: 'Proof uploaded successfully. Admin will verify it soon.',
            receiptImage: payment.receiptImage 
        });
    } catch (error) {
        console.error('Upload proof error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   PATCH api/payments/:paymentId/verify
// @desc    Verify and approve/reject payment (Admin)
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;
        const { status, adminComment } = req.body;

        if (!['completed', 'failed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status for verification' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        payment.status = status as any;
        if (adminComment) {
            payment.metadata = { ...payment.metadata, adminComment };
        }
        
        if (status === 'completed') {
            payment.paymentDate = new Date();
        }

        await payment.save();

        if (status === 'completed') {
            // Enroll the student
            const userId = payment.user.toString();
            const courseId = payment.course.toString();

            let enrollment = await Enrollment.findOne({ user: userId, course: courseId });
            if (!enrollment) {
                enrollment = new Enrollment({ user: userId, course: courseId, status: 'approved' });
            } else {
                enrollment.status = 'approved';
            }
            await enrollment.save();

            // Update course students array
            const course = await Course.findById(courseId);
            if (course) {
                const userObjectId = new mongoose.Types.ObjectId(userId);
                if (!course.enrolledStudents.some(id => id.toString() === userId)) {
                    course.enrolledStudents.push(userObjectId);
                }

                const studentIndex = course.students.findIndex(s => s.studentId.toString() === userId);
                if (studentIndex > -1) {
                    course.students[studentIndex].status = 'approved';
                    course.students[studentIndex].approvedAt = new Date();
                } else {
                    course.students.push({
                        studentId: userObjectId,
                        status: 'approved',
                        enrolledAt: new Date(),
                        approvedAt: new Date()
                    });
                }
                await course.save();
                
                // Award points for enrollment
                await GamificationService.awardPoints(userId, 'course_enroll', {
                    sourceId: courseId,
                    reason: `Enrolled in course: ${course.title}`
                });

                // Update streak for enrollment activity
                await GamificationService.updateStreak(userId);
            }
        }

        // Notify Student
        try {
            await createNotification({
                userId: payment.user,
                type: status === 'completed' ? 'payment_verified' : 'payment_rejected',
                title: status === 'completed' ? 'Payment Verified!' : 'Payment Issue',
                message: status === 'completed' 
                    ? `Your payment for "${payment.course}" has been verified. You now have full access.`
                    : `Your payment was not verified. ${adminComment ? 'Reason: ' + adminComment : 'Please check your details.'}`,
                link: status === 'completed' ? '/student/browse' : '/payment'
            });
            
            // Also attempt socket notification
            notifyUser(payment.user.toString(), `Your payment has been ${status === 'completed' ? 'verified' : 'rejected'}.`, { paymentId });
        } catch (notifyErr) {
            console.error('Notification error:', notifyErr);
        }

        res.json({ message: `Payment ${status} successfully`, payment });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
