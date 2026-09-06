import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { redis } from './redis.js';

export interface ClientToServerEvents {
    'driver:update-location': (data: { driverId: string, vechileType : string, lat: number, lng: number }) => void;
    'driver:go-online': (driverId: string) => void;
    'driver:go-offline': (driverId: string) => void;
}

export interface ServerToClientEvents {
    'ride:new-request': (data: { rideId: string, pickupLat: number, pickupLng: number }) => void;
    'ride:status-changed': (data: { rideId: string, status: string }) => void;
    'error': (message: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
    driverId?: string; 
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

        socket.on('driver:go-online', (driverId) => {
            socket.data.driverId = driverId;
            console.log(`Driver ${driverId} is online.`);
        });

        socket.on('driver:update-location', async (data) => {
            try {
                const memberString = `${data.driverId}:${data.vechileType}`;

                await redis.geoadd(
                    'drivers:locations', 
                    data.lng, 
                    data.lat, 
                    memberString
                );
                
                console.log(`Driver ${data.driverId} moved to ${data.lat}, ${data.lng}`);
            } catch (error) {
                console.error('Failed to update driver location in Redis:', error);
            }
        });

        socket.on('driver:go-offline', async (driverId) => {
            try {
                await redis.zrem('drivers:locations', driverId);
                console.log(`Driver ${driverId} went offline.`);
            } catch (error) {
                console.error('Failed to remove driver from Redis:', error);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);
            
            if (socket.data.driverId) {
                try {
                    await redis.zrem('drivers:locations', socket.data.driverId);
                    console.log(`Disconnected Driver ${socket.data.driverId} removed from map.`);
                } catch (error) {
                    console.error('Failed to clean up disconnected driver:', error);
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized.");
    }
    return io;
};