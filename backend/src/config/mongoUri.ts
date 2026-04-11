/**
 * MongoDB Atlas / local URI resolution — single source of truth.
 *
 * Priority: MONGO_URI → MONGODB_URI → local default (only when not on Render).
 * On Render, set MONGO_URI or MONGODB_URI in the dashboard to your Atlas connection string.
 */

const LOCAL_DEFAULT = 'mongodb://localhost:27017/sesa_db';

export function ensureMongoUriFromEnv(): void {
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

/** Mongoose options suitable for Atlas (mongodb+srv) and local MongoDB. */
export const MONGOOSE_CONNECT_OPTIONS = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
} as const;
