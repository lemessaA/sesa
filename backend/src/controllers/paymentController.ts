import type { Response } from 'express';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import type { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Process payment for course access
 * POST /api/payments/:courseId
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

/**
 * Get payment history for user
 * GET /api/payments/history
 */
export const getPaymentHistory = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('Authentication required', 401));
    }

    const payments = await Payment.find({ userId })
      .populate('courseId', 'title price')
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment details
 * GET /api/payments/:paymentId
 */
export const getPaymentDetails = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('Authentication required', 401));
    }

    const payment = await Payment.findById(paymentId)
      .populate('courseId', 'title price')
      .populate('userId', 'name email');

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Verify user owns this payment
    if (payment.userId.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    res.json({
      success: true,
      payment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify payment status
 * GET /api/payments/:paymentId/verify
 */
export const verifyPayment = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('Authentication required', 401));
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Verify user owns this payment
    if (payment.userId.toString() !== userId) {
      return next(new AppError('Access denied', 403));
    }

    res.json({
      success: true,
      verified: payment.status === 'completed',
      payment: {
        paymentId: payment._id,
        status: payment.status,
        transactionId: payment.transactionId,
        amount: payment.amount
      }
    });
  } catch (err) {
    next(err);
  }
};
