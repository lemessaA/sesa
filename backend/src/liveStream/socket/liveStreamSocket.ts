import { Server as SocketIOServer, Namespace, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import LiveSession from '../models/LiveSession.js';
import StreamEvent from '../models/StreamEvent.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';
import { redisSet, redisGet, redisDel, redisIncr, redisDecr } from '../../utils/redisClient.js';
import logger from '../../utils/logger.js';

const PARTICIPANT_KEY = (roomId: string) => `live:participants:${roomId}`;
const CHAT_KEY = (roomId: string) => `live:chat:${roomId}`;
const HAND_KEY = (roomId: string) => `live:hands:${roomId}`;
const RATE_KEY = (userId: string, roomId: string) => `live:msgrate:${userId}:${roomId}`;

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
    userName?: string;
    roomId?: string;
    sessionDbId?: string;
}

interface JwtPayload {
    user: { id: string; role: string; name?: string; email?: string };
}

interface PeerInfo {
    peerId: string;
    peerName: string;
    peerRole: string;
}

// ── In-memory room participant tracking for WebRTC P2P signaling ──
const roomPeers = new Map<string, Map<string, PeerInfo>>();
// Track who is screen sharing per room
const roomScreenSharer = new Map<string, string>();

const MODERATOR_ROLES = ['instructor', 'admin', 'super_admin', 'assistant_instructor'];

export const initLiveStreamSocket = (io: SocketIOServer): void => {
    const live: Namespace = io.of('/live');

    // JWT Auth middleware
    live.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) return next(new Error('Authentication required'));
            const secret = process.env.JWT_SECRET;
            if (!secret) return next(new Error('Server configuration error'));
            const decoded = jwt.verify(token, secret) as JwtPayload;
            socket.userId = decoded.user.id;
            socket.userRole = decoded.user.role;
            socket.userName = decoded.user.name || 'Anonymous';
            next();
        } catch { next(new Error('Invalid token')); }
    });

    live.on('connection', (socket: AuthenticatedSocket) => {
        logger.debug(`[LiveSocket] User ${socket.userId} (${socket.userRole}) connected`);

        // ── JOIN ROOM ──
        socket.on('live:join', async ({ sessionId }: { sessionId: string }) => {
            try {
                const session = await LiveSession.findById(sessionId).lean();
                if (!session || session.status !== 'live') { socket.emit('live:error', { message: 'Session not available' }); return; }
                socket.roomId = session.roomId;
                socket.sessionDbId = sessionId;

                // Build peer list BEFORE adding this user
                const existingPeers = roomPeers.get(session.roomId);
                const peers: PeerInfo[] = existingPeers
                    ? Array.from(existingPeers.values()).filter(p => p.peerId !== socket.userId)
                    : [];

                // Add this user to the room peer map
                if (!roomPeers.has(session.roomId)) roomPeers.set(session.roomId, new Map());
                roomPeers.get(session.roomId)!.set(socket.userId!, {
                    peerId: socket.userId!,
                    peerName: socket.userName!,
                    peerRole: socket.userRole!,
                });

                await socket.join(`live:${session.roomId}`);
                await socket.join(`user:${socket.userId}`);
                const count = await redisIncr(PARTICIPANT_KEY(session.roomId), 86400);

                // Update peak participants
                if (count > (session.peakParticipants || 0)) {
                    await LiveSession.findByIdAndUpdate(sessionId, { peakParticipants: count, participantCount: count });
                } else {
                    await LiveSession.findByIdAndUpdate(sessionId, { participantCount: count });
                }

                // Send peer list to new joiner (for WebRTC P2P connections)
                socket.emit('live:peers_list', { peers });

                // If someone is screen sharing, notify the new joiner
                const screenSharer = roomScreenSharer.get(session.roomId);
                if (screenSharer) {
                    const sharerInfo = roomPeers.get(session.roomId)?.get(screenSharer);
                    socket.emit('live:screen_share_started', {
                        userId: screenSharer,
                        userName: sharerInfo?.peerName || 'Unknown',
                    });
                }

                // Broadcast to existing peers that a new peer joined
                live.to(`live:${session.roomId}`).emit('live:participant_joined', {
                    userId: socket.userId, userName: socket.userName, role: socket.userRole, count,
                    // Include peer info for WebRTC
                    peerId: socket.userId, peerName: socket.userName, peerRole: socket.userRole,
                });

                const chatHistory = await redisGet(CHAT_KEY(session.roomId));
                if (chatHistory) socket.emit('live:chat_history', JSON.parse(chatHistory));
                const handsRaw = await redisGet(HAND_KEY(session.roomId));
                if (handsRaw) socket.emit('live:hand_queue', JSON.parse(handsRaw));
            } catch (err: any) { logger.error(`[LiveSocket] join error: ${err.message}`); socket.emit('live:error', { message: 'Failed to join session' }); }
        });

        // ── CHAT MESSAGE ──
        socket.on('live:chat', async ({ text }: { text: string }) => {
            try {
                if (!socket.roomId) return;
                const rateKey = RATE_KEY(socket.userId!, socket.roomId);
                const msgCount = await redisIncr(rateKey, 10);
                if (msgCount > 5) { socket.emit('live:error', { message: 'Sending messages too fast' }); return; }
                const sanitized = text?.trim().slice(0, 500);
                if (!sanitized) return;
                const message = { id: `${Date.now()}-${socket.userId}`, userId: socket.userId, userName: socket.userName, role: socket.userRole, text: sanitized, timestamp: new Date().toISOString() };
                const chatHistory = await redisGet(CHAT_KEY(socket.roomId));
                const messages: typeof message[] = chatHistory ? JSON.parse(chatHistory) : [];
                messages.push(message);
                if (messages.length > 100) messages.shift();
                await redisSet(CHAT_KEY(socket.roomId), JSON.stringify(messages), 86400);
                live.to(`live:${socket.roomId}`).emit('live:chat_message', message);

                // Update attendance chat count
                if (socket.sessionDbId && socket.userId) {
                    await Attendance.findOneAndUpdate({ sessionId: socket.sessionDbId, userId: socket.userId }, { $inc: { chatMessagesSent: 1 } }).catch(() => {});
                }
            } catch (err: any) { logger.error(`[LiveSocket] chat error: ${err.message}`); }
        });

        // ── DELETE MESSAGE (host moderation) ──
        socket.on('live:delete_message', async ({ messageId }: { messageId: string }) => {
            try {
                if (!socket.roomId) return;
                if (!MODERATOR_ROLES.includes(socket.userRole || '')) { socket.emit('live:error', { message: 'Only the host can delete messages' }); return; }
                const chatHistory = await redisGet(CHAT_KEY(socket.roomId));
                if (chatHistory) {
                    const msgs = JSON.parse(chatHistory).filter((m: any) => m.id !== messageId);
                    await redisSet(CHAT_KEY(socket.roomId), JSON.stringify(msgs), 86400);
                }
                live.to(`live:${socket.roomId}`).emit('live:message_deleted', { messageId });
            } catch (err: any) { logger.error(`[LiveSocket] delete_message error: ${err.message}`); }
        });

        // ── RAISE HAND ──
        socket.on('live:raise_hand', async () => {
            try {
                if (!socket.roomId) return;
                const entry = { userId: socket.userId, userName: socket.userName, raisedAt: new Date().toISOString() };
                const handsRaw = await redisGet(HAND_KEY(socket.roomId));
                const hands: typeof entry[] = handsRaw ? JSON.parse(handsRaw) : [];
                if (!hands.find(h => h.userId === socket.userId)) { hands.push(entry); await redisSet(HAND_KEY(socket.roomId), JSON.stringify(hands), 86400); }
                live.to(`live:${socket.roomId}`).emit('live:hand_raised', { userId: socket.userId, userName: socket.userName, queue: hands });
            } catch (err: any) { logger.error(`[LiveSocket] raise_hand error: ${err.message}`); }
        });

        // ── LOWER HAND ──
        socket.on('live:lower_hand', async ({ targetUserId }: { targetUserId?: string }) => {
            try {
                if (!socket.roomId) return;
                const userId = targetUserId || socket.userId;
                const handsRaw = await redisGet(HAND_KEY(socket.roomId));
                if (!handsRaw) return;
                const hands = (JSON.parse(handsRaw) as any[]).filter(h => h.userId !== userId);
                await redisSet(HAND_KEY(socket.roomId), JSON.stringify(hands), 86400);
                live.to(`live:${socket.roomId}`).emit('live:hand_lowered', { userId, queue: hands });
            } catch (err: any) { logger.error(`[LiveSocket] lower_hand error: ${err.message}`); }
        });

        // ── HOST MUTE/UNMUTE PARTICIPANT ──
        socket.on('live:mute_user', async ({ targetUserId, muted }: { targetUserId: string; muted: boolean }) => {
            try {
                if (!socket.roomId) return;
                if (!MODERATOR_ROLES.includes(socket.userRole || '')) { socket.emit('live:error', { message: 'Only the host can mute participants' }); return; }
                live.to(`user:${targetUserId}`).emit('live:muted', { muted, by: socket.userId, byName: socket.userName });
                live.to(`live:${socket.roomId}`).emit('live:participant_muted', { targetUserId, muted, by: socket.userId });
                logger.info(`[LiveSocket] ${socket.userName} ${muted ? 'muted' : 'unmuted'} user ${targetUserId}`);
            } catch (err: any) { logger.error(`[LiveSocket] mute_user error: ${err.message}`); }
        });

        // ── SCREEN SHARE START ──
        socket.on('live:screen_share_start', () => {
            if (!socket.roomId) return;
            roomScreenSharer.set(socket.roomId, socket.userId!);
            live.to(`live:${socket.roomId}`).emit('live:screen_share_started', {
                userId: socket.userId,
                userName: socket.userName,
            });
            logger.info(`[LiveSocket] ${socket.userName} started screen sharing in room ${socket.roomId}`);
        });

        // ── SCREEN SHARE STOP ──
        socket.on('live:screen_share_stop', () => {
            if (!socket.roomId) return;
            if (roomScreenSharer.get(socket.roomId) === socket.userId) {
                roomScreenSharer.delete(socket.roomId);
            }
            live.to(`live:${socket.roomId}`).emit('live:screen_share_stopped', {
                userId: socket.userId,
            });
            logger.info(`[LiveSocket] ${socket.userName} stopped screen sharing in room ${socket.roomId}`);
        });

        // ── FORCE STOP SCREEN SHARE (moderator) ──
        socket.on('live:force_stop_screen_share', ({ targetUserId }: { targetUserId: string }) => {
            if (!socket.roomId) return;
            if (!MODERATOR_ROLES.includes(socket.userRole || '')) return;
            live.to(`user:${targetUserId}`).emit('live:force_stop_screen_share');
            if (roomScreenSharer.get(socket.roomId) === targetUserId) {
                roomScreenSharer.delete(socket.roomId);
            }
            live.to(`live:${socket.roomId}`).emit('live:screen_share_stopped', { userId: targetUserId });
        });

        // ── KICK USER VIA SOCKET (moderator) ──
        socket.on('live:kick_user', async ({ targetUserId }: { targetUserId: string }) => {
            try {
                if (!socket.roomId) return;
                if (!MODERATOR_ROLES.includes(socket.userRole || '')) { socket.emit('live:error', { message: 'Insufficient permissions' }); return; }
                live.to(`user:${targetUserId}`).emit('live:kicked', { message: 'You have been removed from this session' });
                // Remove from peer map
                roomPeers.get(socket.roomId)?.delete(targetUserId);
                // Force disconnect the target's sockets in this room
                const sockets = await live.in(`user:${targetUserId}`).fetchSockets();
                for (const s of sockets) {
                    if ((s as any).roomId === socket.roomId) s.disconnect(true);
                }
                logger.info(`[LiveSocket] ${socket.userName} kicked user ${targetUserId}`);
            } catch (err: any) { logger.error(`[LiveSocket] kick_user error: ${err.message}`); }
        });

        // ── WebRTC SIGNALING (P2P) ──
        socket.on('live:webrtc_offer', ({ to, offer }: any) => {
            live.to(`user:${to}`).emit('live:webrtc_offer', { from: socket.userId, offer });
        });
        socket.on('live:webrtc_answer', ({ to, answer }: any) => {
            live.to(`user:${to}`).emit('live:webrtc_answer', { from: socket.userId, answer });
        });
        socket.on('live:webrtc_ice_candidate', ({ to, candidate }: any) => {
            live.to(`user:${to}`).emit('live:webrtc_ice_candidate', { from: socket.userId, candidate });
        });

        // ── DISCONNECT ──
        socket.on('disconnect', async () => {
            try {
                if (!socket.roomId) return;
                // Remove from peer map
                roomPeers.get(socket.roomId)?.delete(socket.userId!);
                if (roomPeers.get(socket.roomId)?.size === 0) roomPeers.delete(socket.roomId);

                // Clear screen share if this user was sharing
                if (roomScreenSharer.get(socket.roomId) === socket.userId) {
                    roomScreenSharer.delete(socket.roomId);
                    live.to(`live:${socket.roomId}`).emit('live:screen_share_stopped', { userId: socket.userId });
                }

                const count = await redisDecr(PARTICIPANT_KEY(socket.roomId));
                live.to(`live:${socket.roomId}`).emit('live:participant_left', {
                    userId: socket.userId, userName: socket.userName, count: Math.max(0, count),
                    peerId: socket.userId,
                });
                if (socket.sessionDbId && socket.userId) {
                    await Attendance.findOneAndUpdate({ sessionId: socket.sessionDbId, userId: socket.userId }, { leftAt: new Date() }).catch(() => {});
                    await StreamEvent.create({ sessionId: new mongoose.Types.ObjectId(socket.sessionDbId), userId: new mongoose.Types.ObjectId(socket.userId), eventType: 'leave', timestamp: new Date() }).catch(() => {});
                }
            } catch (err: any) { logger.error(`[LiveSocket] disconnect error: ${err.message}`); }
        });
    });

    logger.info('[LiveSocket] /live namespace initialized (V2 — P2P + Screen Share)');
};
