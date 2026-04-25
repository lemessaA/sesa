import {
    isRedisConfigured,
    redisDel,
    redisExpire,
    redisGet,
    redisSAdd,
    redisSMembers,
    redisSRem,
    redisSet,
} from '../utils/redisClient.js';

export interface StudyRoomParticipant {
    userId: string;
    userName: string;
    role: 'host' | 'participant';
    joinedAt: Date;
    isActive: boolean;
}

export interface StudyRoom {
    id: string;
    name: string;
    courseId: string;
    hostId: string;
    participants: StudyRoomParticipant[];
    isActive: boolean;
    maxParticipants: number;
    settings: {
        allowScreenShare: boolean;
        allowChat: boolean;
        allowVoice: boolean;
        isPublic: boolean;
        requireApproval: boolean;
    };
    currentActivity: {
        type: 'discussion' | 'quiz' | 'presentation' | 'study' | 'break';
        startedAt: Date;
        data?: any;
    };
    createdAt: Date;
}

export interface WhiteboardElement {
    id: string;
    type: 'line' | 'rectangle' | 'circle' | 'text' | 'arrow';
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[];
    text?: string;
    color: string;
    strokeWidth: number;
    userId: string;
    timestamp: Date;
}

export interface WhiteboardState {
    roomId: string;
    elements: WhiteboardElement[];
    lastModified: Date;
}

export interface RoomMessage {
    id: string;
    userId: string;
    userName: string;
    message: string;
    type: string;
    timestamp: Date;
}

const ACTIVE_ROOM_TTL_SECONDS = 24 * 60 * 60;
export const CLOSED_ROOM_TTL_SECONDS = 60 * 60;

const memoryRooms = new Map<string, StudyRoom>();
const memoryWhiteboards = new Map<string, WhiteboardState>();
const memoryMessages = new Map<string, RoomMessage[]>();

const roomsIndexKey = 'collaboration:rooms:index';
const roomKey = (roomId: string) => `collaboration:room:${roomId}`;
const whiteboardKey = (roomId: string) => `collaboration:whiteboard:${roomId}`;
const messagesKey = (roomId: string) => `collaboration:messages:${roomId}`;

const shouldUseRedis = () => isRedisConfigured();

const serializeRoom = (room: StudyRoom) =>
    JSON.stringify({
        ...room,
        createdAt: room.createdAt.toISOString(),
        currentActivity: {
            ...room.currentActivity,
            startedAt: room.currentActivity.startedAt.toISOString(),
        },
        participants: room.participants.map((participant) => ({
            ...participant,
            joinedAt: participant.joinedAt.toISOString(),
        })),
    });

const deserializeRoom = (raw: string): StudyRoom => {
    const parsed = JSON.parse(raw) as Omit<StudyRoom, 'createdAt' | 'participants' | 'currentActivity'> & {
        createdAt: string;
        participants: Array<Omit<StudyRoomParticipant, 'joinedAt'> & { joinedAt: string }>;
        currentActivity: Omit<StudyRoom['currentActivity'], 'startedAt'> & { startedAt: string };
    };

    return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        currentActivity: {
            ...parsed.currentActivity,
            startedAt: new Date(parsed.currentActivity.startedAt),
        },
        participants: parsed.participants.map((participant) => ({
            ...participant,
            joinedAt: new Date(participant.joinedAt),
        })),
    };
};

const serializeWhiteboard = (whiteboard: WhiteboardState) =>
    JSON.stringify({
        ...whiteboard,
        lastModified: whiteboard.lastModified.toISOString(),
        elements: whiteboard.elements.map((element) => ({
            ...element,
            timestamp: element.timestamp.toISOString(),
        })),
    });

const deserializeWhiteboard = (raw: string): WhiteboardState => {
    const parsed = JSON.parse(raw) as Omit<WhiteboardState, 'lastModified' | 'elements'> & {
        lastModified: string;
        elements: Array<Omit<WhiteboardElement, 'timestamp'> & { timestamp: string }>;
    };

    return {
        ...parsed,
        lastModified: new Date(parsed.lastModified),
        elements: parsed.elements.map((element) => ({
            ...element,
            timestamp: new Date(element.timestamp),
        })),
    };
};

const serializeMessages = (messages: RoomMessage[]) =>
    JSON.stringify(
        messages.map((message) => ({
            ...message,
            timestamp: message.timestamp.toISOString(),
        }))
    );

const deserializeMessages = (raw: string): RoomMessage[] => {
    const parsed = JSON.parse(raw) as Array<Omit<RoomMessage, 'timestamp'> & { timestamp: string }>;
    return parsed.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
    }));
};

export const saveStudyRoom = async (
    room: StudyRoom,
    ttlSeconds = room.isActive ? ACTIVE_ROOM_TTL_SECONDS : CLOSED_ROOM_TTL_SECONDS
): Promise<void> => {
    memoryRooms.set(room.id, room);

    if (!shouldUseRedis()) return;

    await Promise.all([
        redisSet(roomKey(room.id), serializeRoom(room), ttlSeconds),
        redisSAdd(roomsIndexKey, room.id),
        redisExpire(roomsIndexKey, ACTIVE_ROOM_TTL_SECONDS),
    ]);
};

export const getStudyRoom = async (roomId: string): Promise<StudyRoom | null> => {
    if (shouldUseRedis()) {
        const raw = await redisGet(roomKey(roomId));
        if (raw) {
            const room = deserializeRoom(raw);
            memoryRooms.set(roomId, room);
            return room;
        }
    }

    return memoryRooms.get(roomId) || null;
};

export const listStudyRooms = async (): Promise<StudyRoom[]> => {
    if (shouldUseRedis()) {
        const roomIds = await redisSMembers(roomsIndexKey);
        const rooms = await Promise.all(roomIds.map((roomId) => getStudyRoom(roomId)));
        return rooms.filter((room): room is StudyRoom => Boolean(room));
    }

    return [...memoryRooms.values()];
};

export const saveWhiteboard = async (
    roomId: string,
    whiteboard: WhiteboardState,
    ttlSeconds = ACTIVE_ROOM_TTL_SECONDS
): Promise<void> => {
    memoryWhiteboards.set(roomId, whiteboard);

    if (!shouldUseRedis()) return;

    await redisSet(whiteboardKey(roomId), serializeWhiteboard(whiteboard), ttlSeconds);
};

export const getWhiteboard = async (roomId: string): Promise<WhiteboardState | null> => {
    if (shouldUseRedis()) {
        const raw = await redisGet(whiteboardKey(roomId));
        if (raw) {
            const whiteboard = deserializeWhiteboard(raw);
            memoryWhiteboards.set(roomId, whiteboard);
            return whiteboard;
        }
    }

    return memoryWhiteboards.get(roomId) || null;
};

export const saveRoomMessages = async (
    roomId: string,
    messages: RoomMessage[],
    ttlSeconds = ACTIVE_ROOM_TTL_SECONDS
): Promise<void> => {
    memoryMessages.set(roomId, messages);

    if (!shouldUseRedis()) return;

    await redisSet(messagesKey(roomId), serializeMessages(messages), ttlSeconds);
};

export const getRoomMessages = async (roomId: string): Promise<RoomMessage[]> => {
    if (shouldUseRedis()) {
        const raw = await redisGet(messagesKey(roomId));
        if (raw) {
            const messages = deserializeMessages(raw);
            memoryMessages.set(roomId, messages);
            return messages;
        }
    }

    return memoryMessages.get(roomId) || [];
};

export const deleteStudyRoom = async (roomId: string): Promise<void> => {
    memoryRooms.delete(roomId);
    memoryWhiteboards.delete(roomId);
    memoryMessages.delete(roomId);

    if (!shouldUseRedis()) return;

    await Promise.all([
        redisDel(roomKey(roomId)),
        redisDel(whiteboardKey(roomId)),
        redisDel(messagesKey(roomId)),
        redisSRem(roomsIndexKey, roomId),
    ]);
};
