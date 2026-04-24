import mongoose, { Schema, Document } from 'mongoose';

export type LiveSessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type StreamQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';

export interface ILiveSession extends Document {
    roomId: string;
    courseId: mongoose.Types.ObjectId;
    hostId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: LiveSessionStatus;
    scheduledAt?: Date;
    startedAt?: Date;
    endedAt?: Date;

    // ── Capacity & Scaling ──
    maxParticipants: number;
    participantCount: number;
    peakParticipants: number;

    // ── Feature Toggles ──
    chatEnabled: boolean;
    raiseHandEnabled: boolean;
    waitingRoomEnabled: boolean;
    recordingEnabled: boolean;
    screenShareEnabled: boolean;

    // ── Recording State ──
    isRecording: boolean;
    recordingId?: string;
    recordingUrl?: string;

    // ── Media Routing ──
    livekitRoomName: string;
    hlsPlaybackUrl?: string;        // HLS endpoint for large-scale fan-out
    hlsEnabled: boolean;             // Whether to enable HLS for this session

    // ── Access Control ──
    allowedRoles: string[];

    // ── Analytics (aggregated on end) ──
    analytics: {
        totalAttendees: number;
        peakConcurrent: number;
        dropOffRate: number;          // percentage
        avgWatchTimeSeconds: number;
        chatMessageCount: number;
        handRaiseCount: number;
    };

    createdAt: Date;
    updatedAt: Date;
}

const LiveSessionSchema: Schema = new Schema(
    {
        roomId: { type: String, required: true, unique: true, index: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 2000 },
        status: {
            type: String,
            enum: ['scheduled', 'live', 'ended', 'cancelled'],
            default: 'scheduled',
            index: true,
        },
        scheduledAt: { type: Date },
        startedAt: { type: Date },
        endedAt: { type: Date },

        // ── Capacity ──
        maxParticipants: { type: Number, default: 50000, min: 1, max: 100000 },
        participantCount: { type: Number, default: 0, min: 0 },
        peakParticipants: { type: Number, default: 0, min: 0 },

        // ── Features ──
        chatEnabled: { type: Boolean, default: true },
        raiseHandEnabled: { type: Boolean, default: true },
        waitingRoomEnabled: { type: Boolean, default: false },
        recordingEnabled: { type: Boolean, default: false },
        screenShareEnabled: { type: Boolean, default: true },

        // ── Recording ──
        isRecording: { type: Boolean, default: false },
        recordingId: { type: String },
        recordingUrl: { type: String },

        // ── Media Routing ──
        livekitRoomName: { type: String, required: true },
        hlsPlaybackUrl: { type: String },
        hlsEnabled: { type: Boolean, default: true },

        // ── Access ──
        allowedRoles: {
            type: [String],
            default: ['student', 'premium_student', 'instructor', 'admin', 'super_admin', 'moderator'],
        },

        // ── Analytics ──
        analytics: {
            totalAttendees: { type: Number, default: 0 },
            peakConcurrent: { type: Number, default: 0 },
            dropOffRate: { type: Number, default: 0 },
            avgWatchTimeSeconds: { type: Number, default: 0 },
            chatMessageCount: { type: Number, default: 0 },
            handRaiseCount: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
LiveSessionSchema.index({ courseId: 1, status: 1 });
LiveSessionSchema.index({ hostId: 1, status: 1 });
LiveSessionSchema.index({ status: 1, startedAt: -1 });
LiveSessionSchema.index({ scheduledAt: 1 }, { sparse: true });

export const LiveSession = mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema);
export default LiveSession;
