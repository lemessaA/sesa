import { Redis } from 'ioredis';
import logger from '../utils/logger.js';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

const getRedisUrl = (): string | null => {
    return process.env.REDIS_URL || process.env.REDIS_URI || null;
};

export const isRedisConfigured = (): boolean => Boolean(getRedisUrl());

export const createRedisClient = (): Redis => {
    const url = getRedisUrl();

    const options = {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        retryStrategy: (times: number) => {
            if (times > 10) {
                logger.warn('[Redis] Max reconnection attempts reached. Operating without Redis.');
                return null;
            }
            return Math.min(times * 500, 3000);
        },
        lazyConnect: true,
    };

    const client = url ? new Redis(url, options) : new Redis({ ...options, host: '127.0.0.1', port: 6379 });

    client.on('connect', () => logger.info('[Redis] Connected successfully'));
    client.on('error', (err: any) => {
        // Only log connection errors as warnings, avoid crashing
        if (err.message.includes('ECONNREFUSED')) {
            const error = err as any;
            logger.warn(`[Redis] Connection refused at ${error.address || '127.0.0.1'}:${error.port || 6379}`);
        } else {
            logger.warn(`[Redis] Error: ${err.message}`);
        }
    });
    client.on('end', () => logger.warn('[Redis] Connection ended permanently'));

    return client;
};

export const getRedisClient = (): Redis | null => {
    const url = getRedisUrl();
    
    // If no URL provided, we are in "No Redis" mode (dev-only single server)
    if (!url) return null;

    if (!redisClient || redisClient.status === 'end') {
        try {
            redisClient = createRedisClient();
            redisClient.connect().catch((err) =>
                logger.warn(`[Redis] Could not connect: ${err.message}. Proceeding without Redis.`)
            );
        } catch (err: any) {
            logger.warn(`[Redis] Initialization failed: ${err.message}`);
            return null;
        }
    }
    
    // If the client exists but the connection is permanently ended, return null 
    // so helpers skip the calls instead of throwing "Connection is closed"
    if (redisClient.status === 'end') return null;
    
    return redisClient;
};

export const getRedisSubscriber = (): Redis | null => {
    const url = getRedisUrl();
    if (!url) return null;

    if (!redisSubscriber || redisSubscriber.status === 'end') {
        try {
            redisSubscriber = createRedisClient();
            redisSubscriber.connect().catch((err) =>
                logger.warn(`[Redis] Subscriber could not connect: ${err.message}`)
            );
        } catch (err: any) {
            logger.warn(`[Redis] Subscriber initialization failed: ${err.message}`);
            return null;
        }
    }

    if (redisSubscriber.status === 'end') return null;

    return redisSubscriber;
};

// ── Helper: set a value with optional TTL ────────────────────────────────────
export const redisSet = async (key: string, value: string, ttlSeconds?: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) return;
    try {
        if (ttlSeconds) {
            await client.setex(key, ttlSeconds, value);
        } else {
            await client.set(key, value);
        }
    } catch (err: any) {
        logger.warn(`[Redis] SET error for key ${key}: ${err.message}`);
    }
};

export const redisGet = async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    if (!client) return null;
    try {
        return await client.get(key);
    } catch (err: any) {
        logger.warn(`[Redis] GET error for key ${key}: ${err.message}`);
        return null;
    }
};

export const redisDel = async (key: string): Promise<void> => {
    const client = getRedisClient();
    if (!client) return;
    try {
        await client.del(key);
    } catch (err: any) {
        logger.warn(`[Redis] DEL error for key ${key}: ${err.message}`);
    }
};

export const redisExpire = async (key: string, ttlSeconds: number): Promise<void> => {
    const client = getRedisClient();
    if (!client) return;
    try {
        await client.expire(key, ttlSeconds);
    } catch (err: any) {
        logger.warn(`[Redis] EXPIRE error for key ${key}: ${err.message}`);
    }
};

export const redisIncr = async (key: string, ttlSeconds?: number): Promise<number> => {
    const client = getRedisClient();
    if (!client) return 0;
    try {
        const val = await client.incr(key);
        if (ttlSeconds && val === 1) {
            await client.expire(key, ttlSeconds);
        }
        return val;
    } catch (err: any) {
        logger.warn(`[Redis] INCR error for key ${key}: ${err.message}`);
        return 0;
    }
};

export const redisDecr = async (key: string): Promise<number> => {
    const client = getRedisClient();
    if (!client) return 0;
    try {
        const val = await client.decr(key);
        return Math.max(0, val);
    } catch (err: any) {
        logger.warn(`[Redis] DECR error for key ${key}: ${err.message}`);
        return 0;
    }
};

export const redisSAdd = async (key: string, ...members: string[]): Promise<void> => {
    if (members.length === 0) return;
    const client = getRedisClient();
    if (!client) return;
    try {
        await client.sadd(key, ...members);
    } catch (err: any) {
        logger.warn(`[Redis] SADD error for key ${key}: ${err.message}`);
    }
};

export const redisSRem = async (key: string, ...members: string[]): Promise<void> => {
    if (members.length === 0) return;
    const client = getRedisClient();
    if (!client) return;
    try {
        await client.srem(key, ...members);
    } catch (err: any) {
        logger.warn(`[Redis] SREM error for key ${key}: ${err.message}`);
    }
};

export const redisSMembers = async (key: string): Promise<string[]> => {
    const client = getRedisClient();
    if (!client) return [];
    try {
        return await client.smembers(key);
    } catch (err: any) {
        logger.warn(`[Redis] SMEMBERS error for key ${key}: ${err.message}`);
        return [];
    }
};
