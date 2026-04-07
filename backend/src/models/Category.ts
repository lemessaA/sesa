import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    description: string;
    icon: string;
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, default: '📚' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
CategorySchema.pre('save', function() {
    this.updatedAt = new Date();
});

export default mongoose.model<ICategory>('Category', CategorySchema);
