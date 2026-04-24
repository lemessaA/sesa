import { EgressClient, EncodedFileOutput, EncodedFileType } from 'livekit-server-sdk';
import logger from '../../utils/logger.js';
import LiveSession from '../models/LiveSession.js';

// ── Config ──────────────────────────────────────
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';

let egressClient: EgressClient | null = null;

if (LIVEKIT_API_KEY && LIVEKIT_API_SECRET && LIVEKIT_URL) {
    try {
        const httpUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
        egressClient = new EgressClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
        logger.info('✅ LiveKit Egress Client initialized');
    } catch (err: any) {
        logger.error(`❌ LiveKit Egress Client failed: ${err.message}`);
    }
}

/**
 * Start recording a room composite (all participants)
 */
export const startRoomRecording = async (roomName: string, sessionId: string) => {
    if (!egressClient) {
        logger.warn('[Recording] Egress client not configured — skipping recording');
        return null;
    }

    try {
        const fileOutput = new EncodedFileOutput({
            fileType: EncodedFileType.MP4,
            filepath: `recordings/${roomName}-${Date.now()}.mp4`,
        });

        const info = await egressClient.startRoomCompositeEgress(roomName, {
            file: fileOutput,
        });

        logger.info(`[Recording] Started egress ${info.egressId} for room ${roomName}`);

        await LiveSession.findByIdAndUpdate(sessionId, {
            recordingId: info.egressId,
            isRecording: true,
        });

        return info.egressId;
    } catch (err: any) {
        logger.error(`[Recording] Failed to start: ${err.message}`);
        return null;
    }
};

/**
 * Stop recording
 */
export const stopRoomRecording = async (egressId: string, sessionId: string) => {
    if (!egressClient) return;

    try {
        const info = await egressClient.stopEgress(egressId);
        logger.info(`[Recording] Stopped egress ${egressId}`);

        await LiveSession.findByIdAndUpdate(sessionId, {
            isRecording: false,
        });

        return info;
    } catch (err: any) {
        logger.error(`[Recording] Failed to stop ${egressId}: ${err.message}`);
    }
};
