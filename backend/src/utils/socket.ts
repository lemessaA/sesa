import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './logger.js';

let io: SocketIOServer;

/** Match Express CORS: comma-separated list, or SOCKET_CORS_ORIGIN if set. */
function socketCorsOrigins(): string | string[] | boolean {
    const raw = process.env.SOCKET_CORS_ORIGIN?.trim() || process.env.CORS_ORIGIN?.trim();
    if (!raw) return '*';
    if (raw === '*') return '*';
    if (raw.includes(',')) return raw.split(',').map((o) => o.trim());
    return raw;
}

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: socketCorsOrigins(),
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket: Socket) => {
        logger.debug(`[Socket] User connected: ${socket.id}`);

        // Join a room based on userId for targeted notifications
        socket.on('join', (userId: string) => {
            if (userId) {
                socket.join(userId);
                logger.debug(`[Socket] User ${userId} joined notification room`);
            }
        });

        socket.on('disconnect', () => {
            logger.debug(`[Socket] User disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

/**
 * Send a notification to a specific user
 * @param userId The ID of the user to notify
 * @param message The message to send
 * @param data Optional extra data
 */
export const notifyUser = (userId: string, message: string, data?: any) => {
    if (io) {
        io.to(userId).emit('notification', {
            message,
            data,
            timestamp: new Date()
        });
    }
};
