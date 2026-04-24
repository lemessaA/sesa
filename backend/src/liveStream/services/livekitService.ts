import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import logger from '../../utils/logger.js';

// ── Config ────────────────────────────────────────────────────────────────────
const getLiveKitConfig = () => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const host = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const httpHost = host.replace('wss://', 'https://').replace('ws://', 'http://');
    return { apiKey, apiSecret, host, httpHost };
};

export const isLiveKitConfigured = (): boolean => {
    const { apiKey, apiSecret } = getLiveKitConfig();
    return !!(apiKey && apiSecret);
};

// ── Room Service Client (singleton) ──────────────────────────────────────────
let _roomService: RoomServiceClient | null = null;

const getRoomService = (): RoomServiceClient | null => {
    if (!isLiveKitConfigured()) return null;
    if (!_roomService) {
        const { httpHost, apiKey, apiSecret } = getLiveKitConfig();
        _roomService = new RoomServiceClient(httpHost, apiKey!, apiSecret!);
    }
    return _roomService;
};

// ── Token Generation ──────────────────────────────────────────────────────────
export interface LiveKitTokenOptions {
    roomName: string;
    participantIdentity: string;
    participantName: string;
    isHost?: boolean;
    canPublish?: boolean;
    canSubscribe?: boolean;
    ttlSeconds?: number;
}

export const generateLiveKitToken = async (opts: LiveKitTokenOptions): Promise<string> => {
    const { apiKey, apiSecret } = getLiveKitConfig();

    if (!apiKey || !apiSecret) {
        logger.warn('[LiveKit] API key/secret not configured. Returning mock token for dev.');
        return `dev-mock-token-${opts.participantIdentity}-${opts.roomName}-${Date.now()}`;
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: opts.participantIdentity,
        name: opts.participantName,
        ttl: opts.ttlSeconds ?? 7200, // 2 hour default
    });

    at.addGrant({
        roomJoin: true,
        room: opts.roomName,
        canPublish: opts.isHost ?? opts.canPublish ?? false,
        canSubscribe: opts.canSubscribe ?? true,
        canPublishData: true,
        roomAdmin: opts.isHost ?? false,
        roomRecord: opts.isHost ?? false,
    });

    return await at.toJwt();
};

// ── Room Lifecycle ────────────────────────────────────────────────────────────
export const createLiveKitRoom = async (
    roomName: string,
    maxParticipants: number = 50000
): Promise<boolean> => {
    const roomService = getRoomService();
    if (!roomService) {
        logger.info('[LiveKit] Room service not available — operating in dev mode');
        return true;
    }

    try {
        await roomService.createRoom({
            name: roomName,
            emptyTimeout: 300,          // close after 5 mins empty
            maxParticipants,
        });
        logger.info(`[LiveKit] Room created: ${roomName} (max: ${maxParticipants})`);
        return true;
    } catch (err: any) {
        // Room may already exist — that's fine
        if (err.message?.includes('already exists')) {
            logger.info(`[LiveKit] Room ${roomName} already exists`);
            return true;
        }
        logger.error(`[LiveKit] Failed to create room ${roomName}: ${err.message}`);
        return false;
    }
};

export const deleteLiveKitRoom = async (roomName: string): Promise<boolean> => {
    const roomService = getRoomService();
    if (!roomService) return true;

    try {
        await roomService.deleteRoom(roomName);
        logger.info(`[LiveKit] Room deleted: ${roomName}`);
        return true;
    } catch (err: any) {
        logger.warn(`[LiveKit] Could not delete room ${roomName}: ${err.message}`);
        return false;
    }
};

export const removeParticipantFromRoom = async (
    roomName: string,
    participantIdentity: string
): Promise<boolean> => {
    const roomService = getRoomService();
    if (!roomService) return false;

    try {
        await roomService.removeParticipant(roomName, participantIdentity);
        logger.info(`[LiveKit] Participant ${participantIdentity} removed from ${roomName}`);
        return true;
    } catch (err: any) {
        logger.warn(`[LiveKit] Failed to remove participant: ${err.message}`);
        return false;
    }
};

export const muteParticipantTrack = async (
    roomName: string,
    participantIdentity: string,
    trackSid: string,
    muted: boolean
): Promise<boolean> => {
    const roomService = getRoomService();
    if (!roomService) return false;

    try {
        await roomService.mutePublishedTrack(roomName, participantIdentity, trackSid, muted);
        return true;
    } catch (err: any) {
        logger.warn(`[LiveKit] Failed to mute track: ${err.message}`);
        return false;
    }
};

export const getRoomParticipants = async (roomName: string) => {
    const roomService = getRoomService();
    if (!roomService) return [];

    try {
        return await roomService.listParticipants(roomName);
    } catch (err: any) {
        logger.warn(`[LiveKit] Failed to list participants: ${err.message}`);
        return [];
    }
};

export const generateRoomName = (courseId: string, sessionId: string): string => {
    return `sesa-${courseId}-${sessionId}`;
};

export const getLiveKitUrl = (): string => {
    return getLiveKitConfig().host;
};
