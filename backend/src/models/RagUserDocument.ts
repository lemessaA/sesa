import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type RagDocStatus = 'pending' | 'indexed' | 'error';

export interface IRagUserDocument extends Document {
  userId: Types.ObjectId;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageRelativePath: string;
  pythonStoreKey: string;
  status: RagDocStatus;
  errorMessage?: string;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ragUserDocumentSchema = new Schema<IRagUserDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    sizeBytes: { type: Number, required: true, min: 0 },
    storageRelativePath: { type: String, required: true },
    /** Same id sent to the Python RAG store (usually Mongo _id as hex string) */
    pythonStoreKey: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'indexed', 'error'], default: 'pending' },
    errorMessage: { type: String },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ragUserDocumentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IRagUserDocument>('RagUserDocument', ragUserDocumentSchema);
