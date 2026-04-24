import { redisSet, redisGet, redisDel } from '../../utils/redisClient.js';
import logger from '../../utils/logger.js';

const WAITING_ROOM_KEY = (roomId: string) => `live:waiting:${roomId}`;

export interface WaitingParticipant {
    userId: string;
    userName: string;
    requestedAt: string;
}

/**
 * Add a participant to the waiting room queue
 */
export const addToWaitingRoom = async (roomId: string, participant: WaitingParticipant) => {
    try {
        const queueRaw = await redisGet(WAITING_ROOM_KEY(roomId));
        const queue: WaitingParticipant[] = queueRaw ? JSON.parse(queueRaw) : [];

        if (!queue.find(p => p.userId === participant.userId)) {
            queue.push(participant);
            await redisSet(WAITING_ROOM_KEY(roomId), JSON.stringify(queue), 86400);
        }
        return queue;
    } catch (err: any) {
        logger.error(`[WaitingRoom] Error adding participant: ${err.message}`);
        return [];
    }
};

/**
 * Remove a participant from the waiting room (approve or reject)
 */
export const removeFromWaitingRoom = async (roomId: string, userId: string) => {
    try {
        const queueRaw = await redisGet(WAITING_ROOM_KEY(roomId));
        if (!queueRaw) return [];

        const queue: WaitingParticipant[] = JSON.parse(queueRaw);
        const newQueue = queue.filter(p => p.userId !== userId);

        await redisSet(WAITING_ROOM_KEY(roomId), JSON.stringify(newQueue), 86400);
        return newQueue;
    } catch (err: any) {
        logger.error(`[WaitingRoom] Error removing participant: ${err.message}`);
        return [];
    }
};

/**
 * Get the current waiting room queue
 */
export const getWaitingRoomQueue = async (roomId: string): Promise<WaitingParticipant[]> => {
    try {
        const queueRaw = await redisGet(WAITING_ROOM_KEY(roomId));
        return queueRaw ? JSON.parse(queueRaw) : [];
    } catch (err: any) {
        logger.error(`[WaitingRoom] Error getting queue: ${err.message}`);
        return [];
    }
};

/**
 * Clear the waiting room
 */
export const clearWaitingRoom = async (roomId: string) => {
    await redisDel(WAITING_ROOM_KEY(roomId));
};
