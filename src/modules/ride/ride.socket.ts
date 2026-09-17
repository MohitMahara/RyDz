import type { Socket } from 'socket.io';
import { redis } from '../../config/redis.js';
import { getIO, type SocketData } from '../../config/socket.js';
import { rideService } from './ride.service.js';

export interface ClientToServerEvents {
    'driver:update-location': (data: { vehicleType: string; lat: number; lng: number }) => void;
    'driver:go-online': () => void;
    'driver:go-offline': () => void;
    'ride:respond': (
        data: { rideId: string; decision: 'ACCEPT' | 'REJECT' },
        callback: (result: { success: boolean; message: string }) => void
    ) => void;
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
    'ride:accepted': (data: {
        rideId: string;
        status: 'ACCEPTED';
        otp: string;
        driver: { id: string; name: string | null; phoneNumber: string; avatarUrl: string | null; rating: number };
        vehicle: { id: string; type: string; make: string; model: string; color: string; plateNumber: string };
    }) => void;
    'error': (message: string) => void;
}

export interface InterServerEvents {}

type RideSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const DRIVER_LOCATIONS_KEY = 'driver:locations';
const userRoom = (userId: string) => `user:${userId}`;
const rideRoom = (rideId: string) => `ride:${rideId}`;

const removeDriverLocation = async (socket: RideSocket) => {
    if (!socket.data.driverLocationMember) return;

    await redis.zrem(DRIVER_LOCATIONS_KEY, socket.data.driverLocationMember);
    delete socket.data.driverLocationMember;
};

export const registerRideSocketHandlers = (socket: RideSocket) => {
    socket.on('driver:go-online', () => {
        const driverId = socket.data.userId;
        socket.join(driverId);
        console.log(`Driver ${driverId} is online.`);
    });

    socket.on('driver:update-location', async (data) => {
        try {
            const driverId = socket.data.userId;
            const memberString = `${driverId}:${data.vehicleType}`;

            if (socket.data.driverLocationMember && socket.data.driverLocationMember !== memberString) {
                await removeDriverLocation(socket);
            }

            socket.data.driverLocationMember = memberString;

            await redis.geoadd(DRIVER_LOCATIONS_KEY, data.lng, data.lat, memberString);
            console.log(`Driver ${driverId} moved to ${data.lat}, ${data.lng}`);
        } catch (error) {
            console.error('Failed to update driver location in Redis:', error);
        }
    });

    socket.on('driver:go-offline', async () => {
        const driverId = socket.data.userId;
        try {
            await removeDriverLocation(socket);
            socket.leave(driverId);
            console.log(`Driver ${driverId} went offline.`);
        } catch (error) {
            console.error('Failed to remove driver from Redis:', error);
        }
    });

    socket.on('ride:respond', async ({ rideId, decision }, callback) => {
        if (decision === 'REJECT') {
            callback({
                success: true,
                message: 'Ride request rejected.'
            });
            return;
        }

        try {
            const acceptedRide = await rideService.acceptRide(socket.data.userId, rideId);
            const io = getIO();
            const room = rideRoom(rideId);

            socket.join(room);
            io.in(userRoom(acceptedRide.riderId)).socketsJoin(room);

            io.to(userRoom(acceptedRide.riderId)).emit('ride:accepted', {
                rideId: acceptedRide.rideId,
                status: 'ACCEPTED',
                otp: acceptedRide.otp,
                driver: acceptedRide.driver,
                vehicle: acceptedRide.vehicle
            });
            io.to(room).emit('ride:status-changed', { rideId, status: 'ACCEPTED' });
            callback({
                success: true,
                message: 'Ride accepted successfully.'
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to accept the ride.';
            callback({ success: false, message });
        }
    });

    socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        try {
            const hadDriverLocation = Boolean(socket.data.driverLocationMember);
            await removeDriverLocation(socket);

            if (hadDriverLocation) {
                console.log(`Disconnected Driver ${socket.data.userId} removed from map.`);
            }
        } catch (error) {
            console.error('Failed to clean up disconnected driver:', error);
        }
    });
};
