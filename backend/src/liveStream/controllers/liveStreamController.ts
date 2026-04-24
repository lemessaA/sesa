import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import LiveSession from '../models/LiveSession.js';
import StreamEvent from '../models/StreamEvent.js';
import Attendance from '../models/Attendance.js';
import {
    generateLiveKitToken, createLiveKitRoom, deleteLiveKitRoom,
    removeParticipantFromRoom, getRoomParticipants, generateRoomName,
    isLiveKitConfigured, getLiveKitUrl,
} from '../services/livekitService.js';
import { startRoomRecording, stopRoomRecording } from '../services/recordingService.js';
import { redisSet, redisGet, redisDel, redisIncr, redisDecr } from '../../utils/redisClient.js';
import { addToWaitingRoom, removeFromWaitingRoom, clearWaitingRoom } from '../services/waitingRoom.js';
import { computeSessionAnalytics, getInstructorAnalytics, getAdminAnalytics } from '../services/analyticsService.js';
import { getIO } from '../../utils/socket.js';
import logger from '../../utils/logger.js';
import type { StreamAuthRequest } from '../middleware/streamAuth.js';

const PARTICIPANT_KEY = (roomId: string) => `live:participants:${roomId}`;
const CHAT_KEY = (roomId: string) => `live:chat:${roomId}`;

const logEvent = async (sessionId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId, eventType: string, metadata?: Record<string, unknown>) => {
    try { await StreamEvent.create({ sessionId, userId, eventType, metadata, timestamp: new Date() }); }
    catch (err: any) { logger.warn(`[StreamEvent] Could not log: ${err.message}`); }
};

// ── CREATE SESSION ────────────────────────────────────────────────────────────
export const createSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, title, description, scheduledAt, maxParticipants, chatEnabled, raiseHandEnabled, waitingRoomEnabled, recordingEnabled, screenShareEnabled, hlsEnabled } = req.body;
        if (!courseId || !title) { res.status(400).json({ success: false, message: 'courseId and title are required' }); return; }

        const sessionId = new mongoose.Types.ObjectId();
        const roomId = uuidv4();
        const livekitRoomName = generateRoomName(courseId, sessionId.toString());

        const session = new LiveSession({
            _id: sessionId, roomId, courseId, hostId: req.user!.id,
            title: title.trim(), description: description?.trim(),
            status: 'scheduled', scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            maxParticipants: maxParticipants || 50000,
            chatEnabled: chatEnabled !== false, raiseHandEnabled: raiseHandEnabled !== false,
            waitingRoomEnabled: !!waitingRoomEnabled, recordingEnabled: !!recordingEnabled,
            screenShareEnabled: screenShareEnabled !== false, hlsEnabled: hlsEnabled !== false,
            livekitRoomName,
        });

        await session.save();
        await logEvent(sessionId, new mongoose.Types.ObjectId(req.user!.id), 'session_start');
        logger.info(`[LiveStream] Session created: ${session._id} by ${req.user!.id}`);
        res.status(201).json({ success: true, message: 'Live session created', data: session });
    } catch (err: any) {
        logger.error(`[LiveStream] createSession error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to create session' });
    }
};

// ── LIST SESSIONS ─────────────────────────────────────────────────────────────
export const listSessions = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, status, page = 1, limit = 20 } = req.query;
        const role = req.user!.role;
        const userId = req.user!.id;
        const filter: Record<string, unknown> = {};

        if (['admin', 'super_admin', 'moderator'].includes(role)) {
            if (courseId) filter.courseId = courseId;
        } else if (['instructor', 'assistant_instructor'].includes(role)) {
            filter.hostId = userId;
            if (courseId) filter.courseId = courseId;
        } else {
            if (courseId) { filter.courseId = courseId; }
            else {
                const enrolledCourses = await mongoose.model('Course').find({
                    $or: [{ enrolledStudents: userId }, { 'students.studentId': userId, 'students.status': 'approved' }]
                }).select('_id');
                filter.courseId = { $in: enrolledCourses.map(c => c._id) };
            }
            filter.status = { $in: ['scheduled', 'live', 'ended'] };
        }
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [sessions, total] = await Promise.all([
            LiveSession.find(filter).populate('hostId', 'name email profileImage').populate('courseId', 'title thumbnailUrl')
                .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            LiveSession.countDocuments(filter),
        ]);

        const enriched = await Promise.all(sessions.map(async (s) => {
            const count = await redisGet(PARTICIPANT_KEY(s.roomId));
            return { ...s, liveParticipantCount: count ? parseInt(count) : s.participantCount };
        }));

        res.json({ success: true, data: enriched, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
    } catch (err: any) {
        logger.error(`[LiveStream] listSessions error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
    }
};

// ── GET ONE SESSION ───────────────────────────────────────────────────────────
export const getSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id)
            .populate('hostId', 'name email profileImage bio').populate('courseId', 'title thumbnailUrl description').lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        const liveCount = await redisGet(PARTICIPANT_KEY(session.roomId));
        res.json({ success: true, data: { ...session, liveParticipantCount: liveCount ? parseInt(liveCount) : session.participantCount } });
    } catch (err: any) {
        logger.error(`[LiveStream] getSession error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to fetch session' });
    }
};

// ── START SESSION ─────────────────────────────────────────────────────────────
export const startSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id);
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        if (session.status === 'live') { res.status(400).json({ success: false, message: 'Session is already live' }); return; }

        await createLiveKitRoom(session.livekitRoomName, session.maxParticipants);
        session.status = 'live';
        session.startedAt = new Date();
        await session.save();

        const token = await generateLiveKitToken({
            roomName: session.livekitRoomName, participantIdentity: req.user!.id,
            participantName: req.user!.name || 'Host', isHost: true, ttlSeconds: 14400,
        });

        try { const io = getIO(); io.to(`course:${session.courseId}`).emit('live:session_started', { sessionId: session._id, title: session.title, courseId: session.courseId }); } catch {}
        await logEvent(session._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(req.user!.id), 'session_start');
        if (session.recordingEnabled) { await startRoomRecording(session.livekitRoomName, (session._id as mongoose.Types.ObjectId).toString()); }

        const livekitUrl = getLiveKitUrl();
        res.json({ success: true, message: 'Session started', data: { session, token, livekitUrl, serverUrl: livekitUrl, useP2P: !isLiveKitConfigured() } });
    } catch (err: any) {
        logger.error(`[LiveStream] startSession error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
};

// ── JOIN SESSION ──────────────────────────────────────────────────────────────
export const joinSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id).lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        if (session.status !== 'live') { res.status(400).json({ success: false, message: `Session is not live (status: ${session.status})` }); return; }

        const currentCount = await redisGet(PARTICIPANT_KEY(session.roomId));
        const count = currentCount ? parseInt(currentCount) : session.participantCount;
        if (count >= session.maxParticipants) { res.status(429).json({ success: false, message: 'Session is at full capacity' }); return; }

        const isHost = session.hostId.toString() === req.user!.id;

        if (session.waitingRoomEnabled && !isHost && !['admin', 'super_admin'].includes(req.user!.role)) {
            await addToWaitingRoom(session.roomId, { userId: req.user!.id, userName: req.user!.name || 'Student', requestedAt: new Date().toISOString() });
            try { const io = getIO(); io.of('/live').to(`live:${session.roomId}`).emit('live:waiting_room_update', { userId: req.user!.id, userName: req.user!.name, action: 'join' }); } catch {}
            res.json({ success: true, message: 'Added to waiting room', data: { waiting: true } });
            return;
        }

        const token = await generateLiveKitToken({
            roomName: session.livekitRoomName, participantIdentity: req.user!.id,
            participantName: req.user!.name || 'Participant', isHost, canPublish: isHost, canSubscribe: true,
        });

        // Create attendance record
        await Attendance.findOneAndUpdate(
            { sessionId: session._id, userId: req.user!.id },
            { $setOnInsert: { courseId: session.courseId, joinedAt: new Date() } },
            { upsert: true, new: true }
        );

        await logEvent(session._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(req.user!.id), 'join');
        const livekitUrl = getLiveKitUrl();
        res.json({
            success: true, message: 'Token issued',
            data: {
                token, livekitUrl, serverUrl: livekitUrl, roomName: session.livekitRoomName,
                session: { _id: session._id, title: session.title, chatEnabled: session.chatEnabled, raiseHandEnabled: session.raiseHandEnabled, waitingRoomEnabled: session.waitingRoomEnabled, hlsEnabled: session.hlsEnabled },
                useP2P: !isLiveKitConfigured(),
            },
        });
    } catch (err: any) {
        logger.error(`[LiveStream] joinSession error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to join session' });
    }
};

// ── END SESSION ───────────────────────────────────────────────────────────────
export const endSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id);
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        if (session.status === 'ended') { res.status(400).json({ success: false, message: 'Session already ended' }); return; }

        const liveCount = await redisGet(PARTICIPANT_KEY(session.roomId));
        session.status = 'ended'; session.endedAt = new Date(); session.participantCount = 0;
        if (liveCount) session.peakParticipants = Math.max(session.peakParticipants, parseInt(liveCount));
        await session.save();

        await redisDel(PARTICIPANT_KEY(session.roomId));
        await redisDel(CHAT_KEY(session.roomId));
        await clearWaitingRoom(session.roomId);
        await deleteLiveKitRoom(session.livekitRoomName);

        try { const io = getIO(); io.of('/live').to(`live:${session.roomId}`).emit('live:session_ended', { sessionId: session._id }); } catch {}
        if (session.isRecording && session.recordingId) { await stopRoomRecording(session.recordingId, (session._id as mongoose.Types.ObjectId).toString()); }

        // Update attendance records and compute analytics
        await Attendance.updateMany({ sessionId: session._id, leftAt: null }, { leftAt: new Date() });
        await computeSessionAnalytics((session._id as mongoose.Types.ObjectId).toString());
        await logEvent(session._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(req.user!.id), 'session_end');

        res.json({ success: true, message: 'Session ended', data: session });
    } catch (err: any) {
        logger.error(`[LiveStream] endSession error: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to end session' });
    }
};

// ── KICK / APPROVE / PARTICIPANTS / MONITOR / UPDATE / RECORDING / FORCE-STOP / ANALYTICS ──

export const kickParticipant = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const { targetUserId } = req.body;
        const session = await LiveSession.findById(req.params.id).lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        await removeParticipantFromRoom(session.livekitRoomName, targetUserId);
        await Attendance.findOneAndUpdate({ sessionId: session._id, userId: targetUserId }, { wasKicked: true, leftAt: new Date() });
        try { const io = getIO(); io.of('/live').to(`user:${targetUserId}`).emit('live:kicked', { sessionId: session._id, message: 'You have been removed from this session' }); } catch {}
        await logEvent(session._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(req.user!.id), 'kick', { targetUserId });
        res.json({ success: true, message: 'Participant removed' });
    } catch (err: any) { logger.error(`[LiveStream] kickParticipant error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to remove participant' }); }
};

export const getParticipants = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id).lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        const participants = await getRoomParticipants(session.livekitRoomName);
        res.json({ success: true, data: participants });
    } catch (err: any) { logger.error(`[LiveStream] getParticipants error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to fetch participants' }); }
};

export const adminMonitor = async (_req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const sessions = await LiveSession.find({ status: 'live' }).populate('hostId', 'name email').populate('courseId', 'title').lean();
        const enriched = await Promise.all(sessions.map(async (s) => {
            const count = await redisGet(PARTICIPANT_KEY(s.roomId));
            return { ...s, liveParticipantCount: count ? parseInt(count) : s.participantCount };
        }));
        res.json({ success: true, data: enriched, total: enriched.length });
    } catch (err: any) { logger.error(`[LiveStream] adminMonitor error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to fetch active sessions' }); }
};

export const updateSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const allowed = ['title', 'description', 'scheduledAt', 'maxParticipants', 'chatEnabled', 'raiseHandEnabled', 'screenShareEnabled', 'hlsEnabled'];
        const updates: Record<string, unknown> = {};
        for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
        const session = await LiveSession.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        res.json({ success: true, data: session });
    } catch (err: any) { logger.error(`[LiveStream] updateSession error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to update session' }); }
};

export const approveParticipant = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const { targetUserId } = req.body;
        const session = await LiveSession.findById(req.params.id).lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        await removeFromWaitingRoom(session.roomId, targetUserId);
        const token = await generateLiveKitToken({ roomName: session.livekitRoomName, participantIdentity: targetUserId, participantName: 'Approved Student', canPublish: false, canSubscribe: true });
        const livekitUrl = getLiveKitUrl();
        try { const io = getIO(); io.of('/live').to(`user:${targetUserId}`).emit('live:approved', { token, livekitUrl, serverUrl: livekitUrl, roomName: session.livekitRoomName }); io.of('/live').to(`live:${session.roomId}`).emit('live:waiting_room_update', { userId: targetUserId, action: 'approve' }); } catch {}
        res.json({ success: true, message: 'Participant approved' });
    } catch (err: any) { logger.error(`[LiveStream] approveParticipant error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to approve participant' }); }
};

export const toggleRecording = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id);
        if (!session || session.status !== 'live') { res.status(404).json({ success: false, message: 'Active session not found' }); return; }
        let newStatus = false;
        if (session.isRecording && session.recordingId) { await stopRoomRecording(session.recordingId, session._id.toString()); newStatus = false; }
        else { await startRoomRecording(session.livekitRoomName, session._id.toString()); newStatus = true; }
        try { const io = getIO(); io.of('/live').to(`live:${session.roomId}`).emit('live:recording_status', { isRecording: newStatus }); } catch {}
        res.json({ success: true, isRecording: newStatus });
    } catch (err: any) { logger.error(`[LiveStream] toggleRecording error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to toggle recording' }); }
};

export const forceStopSession = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id);
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        session.status = 'ended'; session.endedAt = new Date(); await session.save();
        await deleteLiveKitRoom(session.livekitRoomName);
        await redisDel(PARTICIPANT_KEY(session.roomId));
        await redisDel(CHAT_KEY(session.roomId));
        try { const io = getIO(); io.of('/live').to(`live:${session.roomId}`).emit('live:session_ended', { sessionId: session._id, forceStopped: true }); } catch {}
        await logEvent(session._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(req.user!.id), 'force_stop');
        res.json({ success: true, message: 'Session force-stopped' });
    } catch (err: any) { logger.error(`[LiveStream] forceStop error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to force-stop session' }); }
};

export const getSessionAnalytics = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const session = await LiveSession.findById(req.params.id).populate('courseId', 'title').lean();
        if (!session) { res.status(404).json({ success: false, message: 'Session not found' }); return; }
        const attendees = await Attendance.find({ sessionId: session._id }).populate('userId', 'name email profileImage').lean();
        res.json({ success: true, data: { session, attendees } });
    } catch (err: any) { logger.error(`[LiveStream] getAnalytics error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to fetch analytics' }); }
};

export const getAnalyticsDashboard = async (req: StreamAuthRequest, res: Response): Promise<void> => {
    try {
        const role = req.user!.role;
        if (['admin', 'super_admin'].includes(role)) {
            const data = await getAdminAnalytics();
            res.json({ success: true, data });
        } else {
            const data = await getInstructorAnalytics(req.user!.id, req.query.courseId as string | undefined);
            res.json({ success: true, data });
        }
    } catch (err: any) { logger.error(`[LiveStream] dashboard error: ${err.message}`); res.status(500).json({ success: false, message: 'Failed to fetch dashboard' }); }
};
