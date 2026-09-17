import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import {
    registerRideSocketHandlers,
    type ClientToServerEvents,
    type ServerToClientEvents,
    type InterServerEvents
} from '../modules/ride/ride.socket.js';

export interface SocketData {
    driverId?: string;
    driverLocationMember?: string;
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"]
        }
    });

    console.log('WebSocket is initialized.');

    io.on('connection', (socket) => {
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
