import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'manual';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  paymentDate: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['stripe', 'paypal', 'manual'], default: 'manual' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String, required: true, unique: true },
  paymentDate: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // For subscription-based payments
}, { timestamps: true });

// Index for quick lookups
PaymentSchema.index({ userId: 1, courseId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
