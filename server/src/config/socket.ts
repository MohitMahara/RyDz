import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import env from './env.js';
import {
    registerRideSocketHandlers,
    type ClientToServerEvents,
    type ServerToClientEvents,
    type InterServerEvents
} from '../modules/ride/ride.socket.js';

export interface SocketData {
    userId: string;
    driverLocationMember?: string;
}

type SocketJwtPayload = {
    id: string;
};

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (typeof token !== 'string') {
            return next(new Error('Authentication token is required.'));
        }

        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as SocketJwtPayload;

            if (!payload.id) {
                return next(new Error('Invalid authentication token.'));
            }

            socket.data.userId = payload.id;
            return next();
        } catch {
            return next(new Error('Invalid or expired authentication token.'));
        }
    });

    console.log('WebSocket is initialized.');

    io.on('connection', (socket) => {
        socket.join(`user:${socket.data.userId}`);
        console.log(`Client connected: ${socket.id}`);
        registerRideSocketHandlers(socket);
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized.");
    }
    return io;
};
