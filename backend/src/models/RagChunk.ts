import mongoose, { Schema, type Document, type Types } from 'mongoose';

/**
 * One text segment + embedding for user RAG (written by python-agents ingest).
 * Atlas: create a Vector Search index on `embedding` (cosine, 384 dims for all-MiniLM-L6-v2).
 * See `python-agents/atlas-vector-index.example.json`.
 */
export interface IRagChunk extends Document {
  userId: Types.ObjectId;
  documentId: string;
  sourceName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  model: string;
  created: Date;
}

const ragChunkSchema = new Schema<IRagChunk>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: String, required: true, index: true },
    sourceName: { type: String, default: 'document' },
    chunkIndex: { type: Number, default: 0 },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    model: { type: String, default: 'all-MiniLM-L6-v2' },
    created: { type: Date, default: () => new Date() },
  },
  { collection: 'rag_chunks' }
);

ragChunkSchema.index({ userId: 1, documentId: 1 });

export default mongoose.model<IRagChunk>('RagChunk', ragChunkSchema);
