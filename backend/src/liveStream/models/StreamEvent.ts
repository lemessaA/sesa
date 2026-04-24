import mongoose, { Schema, Document } from 'mongoose';

export type StreamEventType =
    | 'join'
    | 'leave'
    | 'mute'
    | 'unmute'
    | 'kick'
    | 'hand_raise'
    | 'hand_lower'
    | 'hand_approve'
    | 'chat'
    | 'screen_share_start'
    | 'screen_share_stop'
    | 'recording_start'
    | 'recording_stop'
    | 'session_start'
    | 'session_end'
    | 'waiting_room_admit'
    | 'waiting_room_deny'
    | 'quality_change'
    | 'reconnect'
    | 'force_stop';

export interface IStreamEvent extends Document {
    sessionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    eventType: StreamEventType;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

const StreamEventSchema: Schema = new Schema({
    sessionId: { type: Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventType: {
        type: String,
        enum: [
            'join', 'leave', 'mute', 'unmute', 'kick',
            'hand_raise', 'hand_lower', 'hand_approve', 'chat',
            'screen_share_start', 'screen_share_stop',
            'recording_start', 'recording_stop',
            'session_start', 'session_end',
            'waiting_room_admit', 'waiting_room_deny',
            'quality_change', 'reconnect', 'force_stop',
        ],
        required: true,
    },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
});

// TTL index: auto-delete events older than 90 days
StreamEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
StreamEventSchema.index({ sessionId: 1, timestamp: -1 });
StreamEventSchema.index({ sessionId: 1, eventType: 1 });

export const StreamEvent = mongoose.model<IStreamEvent>('StreamEvent', StreamEventSchema);
export default StreamEvent;
