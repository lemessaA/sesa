import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    joinedAt: Date;
    leftAt?: Date;
    watchDurationSeconds: number;
    reconnectCount: number;
    qualityChanges: number;
    chatMessagesSent: number;
    handRaised: boolean;
    wasKicked: boolean;
    deviceInfo?: {
        browser?: string;
        os?: string;
        isMobile?: boolean;
    };
}

const AttendanceSchema: Schema = new Schema(
    {
        sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        joinedAt: { type: Date, required: true, default: Date.now },
        leftAt: { type: Date },
        watchDurationSeconds: { type: Number, default: 0, min: 0 },
        reconnectCount: { type: Number, default: 0 },
        qualityChanges: { type: Number, default: 0 },
        chatMessagesSent: { type: Number, default: 0 },
        handRaised: { type: Boolean, default: false },
        wasKicked: { type: Boolean, default: false },
        deviceInfo: {
            browser: { type: String },
            os: { type: String },
            isMobile: { type: Boolean },
        },
    },
    { timestamps: true }
);

// Unique constraint: one attendance record per user per session
AttendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
AttendanceSchema.index({ courseId: 1, userId: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
