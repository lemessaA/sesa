import mongoose, { Schema, Document } from 'mongoose';
import { syncUserCourseRefs } from '../utils/normalizedRefs.js';

export interface IPayment extends Document {
  // New fields (smart enrollment)
  userId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  
  // Old fields (backward compatibility)
  user?: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  
  // Common fields
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'manual' | 'cbe_birr' | 'telebirr' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  paymentDate: Date;
  expiresAt?: Date;
  proofUrl?: string;
  receiptImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  // New fields (smart enrollment)
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  
  // Old fields (backward compatibility)
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  
  // Common fields
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['stripe', 'paypal', 'manual', 'cbe_birr', 'telebirr', 'bank_transfer'], default: 'manual' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  transactionId: { type: String, required: true, unique: true, sparse: true },
  paymentDate: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // For subscription-based payments
  proofUrl: { type: String }, // For manual payment proof
  receiptImage: { type: String }, // Receipt image URL
}, { timestamps: true });

PaymentSchema.pre('validate', function () {
  syncUserCourseRefs(this as unknown as {
    userId?: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId;
    courseId?: mongoose.Types.ObjectId;
    course?: mongoose.Types.ObjectId;
    set: (path: string, value: mongoose.Types.ObjectId | undefined) => void;
  });
});

// Index for quick lookups
PaymentSchema.index({ userId: 1, courseId: 1 });
PaymentSchema.index({ user: 1, course: 1 });
PaymentSchema.index({ status: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
