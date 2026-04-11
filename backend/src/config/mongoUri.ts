/**
 * MongoDB Atlas / local URI resolution — single source of truth.
 *
 * Priority: MONGO_URI → MONGODB_URI → local default (only when not on Render).
 * On Render, set MONGO_URI or MONGODB_URI in the dashboard to your Atlas connection string.
 */

import type { ConnectOptions } from 'mongoose';

/** Local MongoDB (Docker or native install). 127.0.0.1 avoids some IPv6 resolution issues. */
const LOCAL_DEFAULT = 'mongodb://127.0.0.1:27017/sesa_db';

export function ensureMongoUriFromEnv(): void {
    // Full local dev: set USE_LOCAL_DB=1 in backend/.env to ignore Atlas and use local Mongo only.
    if (
        !process.env.RENDER &&
        (process.env.USE_LOCAL_DB === '1' || process.env.USE_LOCAL_DB === 'true')
    ) {
        process.env.MONGO_URI = LOCAL_DEFAULT;
    }
    if (!process.env.MONGO_URI?.trim() && process.env.MONGODB_URI?.trim()) {
        process.env.MONGO_URI = process.env.MONGODB_URI.trim();
    }
    if (!process.env.MONGO_URI?.trim() && !process.env.RENDER) {
        process.env.MONGO_URI = LOCAL_DEFAULT;
    }
}

/** Use after dotenv has loaded (e.g. seed scripts). Throws if URI cannot be resolved. */
export function getMongoUri(): string {
    ensureMongoUriFromEnv();
    const uri = process.env.MONGO_URI?.trim();
    if (!uri) {
        throw new Error(
            'Missing MONGO_URI (or MONGODB_URI). Add your MongoDB Atlas URI to backend/.env — see backend/.env.example'
        );
    }
    return uri;
}

/** Hide credentials in connection strings for logging. */
export function maskMongoUri(uri: string): string {
    return uri.replace(/\/\/[^@/]+@/, '//****:****@');
}

const DEFAULT_SELECTION_MS = 30_000;

/**
 * Mongoose client options for Atlas and local MongoDB.
 * For `mongodb+srv://` (Atlas), defaults to IPv4 (`family: 4`) to avoid DNS/IPv6 issues on some networks.
 * Set `MONGO_DNS_FAMILY=ipv6` to force IPv6, or `MONGO_SERVER_SELECTION_MS` to tune timeouts (ms).
 */
export function getMongooseConnectOptions(uri: string): ConnectOptions {
    const serverSelectionTimeoutMS = Number.parseInt(
        process.env.MONGO_SERVER_SELECTION_MS || String(DEFAULT_SELECTION_MS),
        10
    );
    const connectTimeoutMS = Math.min(serverSelectionTimeoutMS, 20_000);

    const opts: ConnectOptions = {
        serverSelectionTimeoutMS,
        socketTimeoutMS: 45_000,
        connectTimeoutMS,
    };

    if (uri.startsWith('mongodb+srv://')) {
        opts.family = process.env.MONGO_DNS_FAMILY?.toLowerCase() === 'ipv6' ? 6 : 4;
    }

    return opts;
}

/** True if mongodb+srv URI has no database path (defaults to "test"). */
export function mongoSrvUriMissingDbName(uri: string): boolean {
    if (!uri.startsWith('mongodb+srv://')) return false;
    const noQuery = uri.split('?')[0];
    const parts = noQuery.split('/');
    if (parts.length < 4) return true;
    const db = parts[3]?.trim();
    return !db;
}

export const ATLAS_TROUBLESHOOTING = [
    'MongoDB Atlas: Project → Network Access → add 0.0.0.0/0 (dev) or your current IP / Render egress.',
    'Atlas: ensure the cluster is not paused (free tier).',
    'Connection string: copy from Atlas Connect → Drivers; include /databaseName before ?.',
    'Optional: set MONGO_DNS_FAMILY=ipv6 if your network requires IPv6 only.',
].join(' ');
