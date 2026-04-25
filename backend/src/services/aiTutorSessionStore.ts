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

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface LearningSession {
    userId: string;
    courseId: string;
    messages: ChatMessage[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    currentTopic: string;
    strugglingAreas: string[];
    strengths: string[];
}

const SESSION_TTL_SECONDS = 4 * 60 * 60;
const memorySessions = new Map<string, LearningSession>();
const memoryUserSessions = new Map<string, Set<string>>();

const sessionKey = (sessionId: string) => `ai-tutor:session:${sessionId}`;
const userSessionsKey = (userId: string) => `ai-tutor:user:${userId}:sessions`;

const shouldUseRedis = () => isRedisConfigured();

const rememberSession = (sessionId: string, session: LearningSession) => {
    memorySessions.set(sessionId, session);

    const userSessions = memoryUserSessions.get(session.userId) || new Set<string>();
    userSessions.add(sessionId);
    memoryUserSessions.set(session.userId, userSessions);
};

const forgetSession = (sessionId: string, userId?: string) => {
    const resolvedUserId = userId || memorySessions.get(sessionId)?.userId;
    memorySessions.delete(sessionId);

    if (!resolvedUserId) return;

    const userSessions = memoryUserSessions.get(resolvedUserId);
    if (!userSessions) return;

    userSessions.delete(sessionId);
    if (userSessions.size === 0) {
        memoryUserSessions.delete(resolvedUserId);
    }
};

const serializeSession = (session: LearningSession) =>
    JSON.stringify({
        ...session,
        messages: session.messages.map((message) => ({
            ...message,
            timestamp: message.timestamp.toISOString(),
        })),
    });

const deserializeSession = (raw: string): LearningSession => {
    const parsed = JSON.parse(raw) as Omit<LearningSession, 'messages'> & {
        messages: Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
    };

    return {
        ...parsed,
        messages: parsed.messages.map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
        })),
    };
};

export const saveTutorSession = async (sessionId: string, session: LearningSession): Promise<void> => {
    rememberSession(sessionId, session);

    if (!shouldUseRedis()) return;

    await Promise.all([
        redisSet(sessionKey(sessionId), serializeSession(session), SESSION_TTL_SECONDS),
        redisSAdd(userSessionsKey(session.userId), sessionId),
        redisExpire(userSessionsKey(session.userId), SESSION_TTL_SECONDS),
    ]);
};

export const getTutorSession = async (sessionId: string): Promise<LearningSession | null> => {
    if (shouldUseRedis()) {
        const raw = await redisGet(sessionKey(sessionId));
        if (raw) {
            const session = deserializeSession(raw);
            rememberSession(sessionId, session);
            return session;
        }
    }

    return memorySessions.get(sessionId) || null;
};

export const deleteTutorSession = async (sessionId: string): Promise<void> => {
    const session = await getTutorSession(sessionId);
    forgetSession(sessionId, session?.userId);

    if (!shouldUseRedis()) return;

    await Promise.all([
        redisDel(sessionKey(sessionId)),
        session ? redisSRem(userSessionsKey(session.userId), sessionId) : Promise.resolve(),
    ]);
};

export const listTutorSessionsForUser = async (
    userId: string
): Promise<Array<{ sessionId: string; session: LearningSession }>> => {
    if (shouldUseRedis()) {
        const sessionIds = await redisSMembers(userSessionsKey(userId));
        const sessions = await Promise.all(
            sessionIds.map(async (sessionId) => {
                const session = await getTutorSession(sessionId);
                return session ? { sessionId, session } : null;
            })
        );

        return sessions.filter((entry): entry is { sessionId: string; session: LearningSession } => Boolean(entry));
    }

    const sessionIds = [...(memoryUserSessions.get(userId) || new Set<string>())];
    return sessionIds
        .map((sessionId) => {
            const session = memorySessions.get(sessionId);
            return session ? { sessionId, session } : null;
        })
        .filter((entry): entry is { sessionId: string; session: LearningSession } => Boolean(entry));
};
