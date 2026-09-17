import type { Socket } from 'socket.io';
import { redis } from '../../config/redis.js';
import type { SocketData } from '../../config/socket.js';

export interface ClientToServerEvents {
    'driver:update-location': (data: { driverId: string; vechileType: string; lat: number; lng: number }) => void;
    'driver:go-online': (driverId: string) => void;
    'driver:go-offline': (driverId: string) => void;
}

export interface ServerToClientEvents {
    'ride:new-request': (data: {
        rideId: string;
        pickup: { lat: number; lng: number; address: string };
        dropoff: { lat: number; lng: number; address: string };
        tripDetails: { distanceInKm: number; durationInMin: number; fare: number };
        riderDistanceInKm: number;
    }) => void;
    'ride:status-changed': (data: { rideId: string; status: string }) => void;
    'error': (message: string) => void;
}

export interface InterServerEvents {}

type RideSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const DRIVER_LOCATIONS_KEY = 'driver:locations';

const removeDriverLocation = async (socket: RideSocket) => {
    if (!socket.data.driverLocationMember) return;

    await redis.zrem(DRIVER_LOCATIONS_KEY, socket.data.driverLocationMember);
    delete socket.data.driverLocationMember;
};

export const registerRideSocketHandlers = (socket: RideSocket) => {
    socket.on('driver:go-online', (driverId) => {
        socket.data.driverId = driverId;
        socket.join(driverId);
        console.log(`Driver ${driverId} is online.`);
    });

    socket.on('driver:update-location', async (data) => {
        try {
            const memberString = `${data.driverId}:${data.vechileType}`;

            if (socket.data.driverLocationMember && socket.data.driverLocationMember !== memberString) {
                await removeDriverLocation(socket);
            }

            socket.data.driverId = data.driverId;
            socket.data.driverLocationMember = memberString;

            await redis.geoadd(DRIVER_LOCATIONS_KEY, data.lng, data.lat, memberString);
            console.log(`Driver ${data.driverId} moved to ${data.lat}, ${data.lng}`);
        } catch (error) {
            console.error('Failed to update driver location in Redis:', error);
        }
    });

    socket.on('driver:go-offline', async (driverId) => {
        try {
            await removeDriverLocation(socket);
            socket.leave(driverId);
            delete socket.data.driverId;
            console.log(`Driver ${driverId} went offline.`);
        } catch (error) {
            console.error('Failed to remove driver from Redis:', error);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        try {
            await removeDriverLocation(socket);

            if (socket.data.driverId) {
                console.log(`Disconnected Driver ${socket.data.driverId} removed from map.`);
            }
        } catch (error) {
            console.error('Failed to clean up disconnected driver:', error);
        }
    });
};
