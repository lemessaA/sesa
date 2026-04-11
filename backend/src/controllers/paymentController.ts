import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { createNotification } from '../models/Notification.js';
import { notifyUser } from '../utils/socket.js';
import { GamificationService } from '../services/gamificationService.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

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
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
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

        const payment = await Payment.findById(paymentId) as any;
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if ((payment.user || payment.userId)?.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update payment status
        payment.status = 'completed';
        payment.paymentDate = new Date();
        await payment.save();

        // Auto-approve enrollment after successful payment
        let enrollment = await Enrollment.findOne({
            user: payment.user || payment.userId,
            course: payment.course || payment.courseId
        });

        if (!enrollment) {
            enrollment = new Enrollment({
                user: payment.user || payment.userId,
                course: payment.course || payment.courseId,
                status: 'approved'
            });
        } else {
            enrollment.status = 'approved';
        }

        await enrollment.save();

        // Update course enrollment
        const course = await Course.findById(payment.course || payment.courseId);
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

        const payment = await Payment.findById(paymentId) as any;
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
            { user: payment.user || payment.userId, course: payment.course || payment.courseId },
            { status: 'rejected' }
        );

        res.json({ message: 'Payment refunded successfully', payment });
    } catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload proof of payment
export const uploadProof = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user!.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const payment = await Payment.findById(paymentId) as any;
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if ((payment.user || payment.userId)?.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        payment.proofUrl = `/uploads/${req.file.filename}`;
        await payment.save();

        res.json({ message: 'Proof uploaded successfully', payment });
    } catch (error) {
        console.error('Upload proof error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify payment (admin only)
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        const payment = await Payment.findById(paymentId) as any;
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.status = status;
        if (status === 'completed') {
            payment.paymentDate = new Date();

            // Auto-approve enrollment
            let enrollment = await Enrollment.findOne({
                user: payment.user || payment.userId,
                course: payment.course || payment.courseId
            });

            if (!enrollment) {
                enrollment = new Enrollment({
                    user: payment.user || payment.userId,
                    course: payment.course || payment.courseId,
                    status: 'approved'
                });
            } else {
                enrollment.status = 'approved';
            }

            await enrollment.save();

            // Update course
            const course = await Course.findById(payment.course || payment.courseId);
            if (course) {
                const userObjectId = new mongoose.Types.ObjectId((payment.user || payment.userId).toString());
                if (!course.enrolledStudents.some(id => id.toString() === (payment.user || payment.userId).toString())) {
                    course.enrolledStudents.push(userObjectId);
                }

                const existingStudent = course.students.find(s => s.studentId.toString() === (payment.user || payment.userId).toString());
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
        }

        await payment.save();
        res.json({ message: 'Payment verified', payment });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Process payment for course access (NEW - Smart Enrollment)
 * POST /api/payments/course/:courseId
 */
export const processPayment = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { courseId } = req.params;
    const { paymentMethod = 'manual', amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('Authentication required', 401));
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // Verify amount matches course price
    if (amount !== course.price) {
      return next(new AppError('Payment amount does not match course price', 400));
    }

    // Check if user already has paid access
    const user = await User.findById(userId).select('courseEnrollments');
    const existingEnrollment = user?.courseEnrollments?.find(
      e => e.courseId.toString() === courseId && e.accessLevel === 'paid'
    );

    if (existingEnrollment) {
      return next(new AppError('You already have access to this course', 400));
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create payment record
    const payment = new Payment({
      userId,
      courseId,
      amount: course.price,
      paymentMethod,
      status: 'completed', // In production, verify with payment gateway
      transactionId,
      paymentDate: new Date()
    });

    await payment.save();

    // Add course to user's courseEnrollments with paid access
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          courseEnrollments: {
            courseId,
            enrollmentDate: new Date(),
            status: 'active',
            accessLevel: 'paid',
            approvalStatus: 'approved',
            paymentId: payment._id
          }
        }
      },
      { new: true }
    );

    logger.info(`Payment processed: User ${userId} purchased course ${courseId}`);

    res.status(201).json({
      success: true,
      message: 'Payment successful! Course unlocked.',
      payment: {
        paymentId: payment._id,
        courseId,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId
      }
    });
  } catch (err) {
    next(err);
  }
};
