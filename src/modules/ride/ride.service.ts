import type { estimateRideDTO, bookRideDTO } from "./ride.dto.js";
import { routingService } from "../../shared/services/routing.service.js";
import {redis} from "../../config/redis.js";
import prisma from "../../config/db.js";
import { otpService } from "../../shared/services/otp.service.js";
import { getIO } from "../../config/socket.js";
import { AppError } from "../../shared/utils/AppError.util.js";
import type { Prisma } from "../../generated/client/client.js";
import type { VehicleType } from "../../generated/client/enums.js";

class RideService{

  async estimateRide(data : estimateRideDTO){
    const {pick_up_lat, pick_up_lng, drop_off_lat, drop_off_lng} = data;
    const route = await routingService.getRouteDetails(pick_up_lat, pick_up_lng, drop_off_lat, drop_off_lng);
    const fare = await routingService.calculateFare(route.distance, route.duration);

    const nearbyDrivers = await redis.geosearch(
      'driver:locations',
      'FROMLONLAT',
       pick_up_lng,
       pick_up_lat,
      'BYRADIUS',
       3,
      'km',
      'WITHDIST',
      'ASC'
     ) as unknown as [string, string][];

    const driverEtas: Record<string, number | null> = {
      BIKE: null,
      AUTO: null,
      CAB_ECONOMY: null,
      CAB_PREMIUM: null
    };

    const driverDistanceMap: Record<string, number | null> = {
        BIKE : null,
        AUTO : null,
        CAB_ECONOMY : null,
        CAB_PREMIUM : null
    };

    const AVERAGE_SPEED_KM_PER_MIN = 0.4; 
    const WINDING_FACTOR = 1.4;

    for (const [memberString, distanceString] of nearbyDrivers) {
      const [_, vehicleType]  = memberString.split(':'); 
      const distanceKm = parseFloat(distanceString);

      if (!vehicleType) continue;
    
      if(driverDistanceMap[vehicleType] === null) {
        const actualDistanceKm = distanceKm * WINDING_FACTOR; 
        driverDistanceMap[vehicleType] = Number((actualDistanceKm).toFixed(2));
        driverEtas[vehicleType] = Math.max(Math.round(actualDistanceKm / AVERAGE_SPEED_KM_PER_MIN), 1);
      }
      
    }

    const tripDetails = { distance: route.distance, time: route.duration };
    const encodedPolyline = route.geometry;
    const vehicles =  Object.keys(fare.estimates).map(type => ({
          type,
          fare: fare.estimates[type],
          distance: driverDistanceMap[type] || 'No drivers nearby',
          eta: driverEtas[type] || 'No drivers nearby'
    }));

     return {
        tripDetails,
        encodedPolyline,
        vehicles
     }
  }

  async bookRide(riderId : string, data : bookRideDTO){
    const {pick_up_lat, pick_up_lng, pick_up_address, drop_off_lat, drop_off_lng, drop_off_address, requested_vehicle_type, payment_method} = data;
    const io = getIO();
    
    if(!riderId) {
      throw new Error("Rider ID is required to book a ride.");
    }

    const route = await routingService.getRouteDetails(pick_up_lat, pick_up_lng, drop_off_lat, drop_off_lng);
    const {estimates}  = await routingService.calculateFare(route.distance, route.duration);
    const estimatedFare = estimates[requested_vehicle_type];

    if (estimatedFare === undefined) {
      throw new Error(`Fare estimate is unavailable for vehicle type: ${requested_vehicle_type}`);
    }

    const otp : string = await otpService.generateOtp(riderId, "RIDE_VERIFICATION");

    const newRide = await prisma.ride.create({
      data: {
        riderId,
        pickupLat : pick_up_lat,
        pickupLng : pick_up_lng,
        pickupAddress : pick_up_address,
        dropoffAddress : drop_off_address,
        dropoffLat : drop_off_lat, 
        dropoffLng : drop_off_lng,
        requestedVehicleType : requested_vehicle_type,
        otp : otp,
        estimatedFare : estimatedFare,
        distanceInKm : route.distance,
        durationInMinutes : route.duration,
        status: 'SEARCHING'
      }
    });

    const nearbyDrivers = await redis.geosearch(
      'driver:locations',
      'FROMLONLAT',
       pick_up_lng,
       pick_up_lat,
      'BYRADIUS',
       3,
      'km',
      'WITHDIST',
      'ASC'
     ) as unknown as [string, string][];


    let broadcastCount = 0;

    for (const [memberString, distanceString] of nearbyDrivers) {
      const [driverId, type] = memberString.split(':');

      if(!driverId)continue;
      
      if (type === requested_vehicle_type) {
        io.to(driverId).emit('ride:new-request', {
          rideId: newRide.id,
          pickup: { lat: pick_up_lat, lng: pick_up_lng, address: pick_up_address },
          dropoff: { lat: drop_off_lat, lng: drop_off_lng, address : drop_off_address },
          tripDetails : {
            distanceInKm : route.distance,
            durationInMin : route.duration,
            fare: estimatedFare
          },
          riderDistanceInKm : parseFloat(distanceString)
        });
        broadcastCount++;
      }
    }

    return {
       rideId : newRide.id,
       otp,
       broadcastedTo : broadcastCount
    }

  }

  private async getEligibleDriverVehicle(tx: Prisma.TransactionClient, driverId: string) {
    const driverProfile = await tx.driverProfile.findUnique({
      where: { userId: driverId },
      include: { activeVehicle: true }
    });

    if (!driverProfile || driverProfile.deletedAt) {
      throw new AppError('Driver profile not found.', 404);
    }

    if (!driverProfile.isAvailable || driverProfile.kycStatus !== 'APPROVED' || !driverProfile.licenseVerified) {
      throw new AppError('Driver is not eligible to accept rides.', 403);
    }

    const vehicle = driverProfile.activeVehicle;
    if (!vehicle || vehicle.status !== 'ACTIVE' || vehicle.deletedAt || !vehicle.isVerified) {
      throw new AppError('An active verified vehicle is required to accept rides.', 403);
    }

    return vehicle;
  }

  private async assignSearchingRide(
    tx: Prisma.TransactionClient,
    rideId: string,
    driverId: string,
    vehicle: { id: string; vehicleType: VehicleType }
  ) {
    const result = await tx.ride.updateMany({
      where: {
        id: rideId,
        status: 'SEARCHING',
        requestedVehicleType: vehicle.vehicleType
      },
      data: {
        driverId,
        vehicleId: vehicle.id,
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    if (result.count === 0) {
      throw new AppError('This ride is no longer available.', 409);
    }
  }

  private async getAcceptedRideDetails(tx: Prisma.TransactionClient, rideId: string) {
    const ride = await tx.ride.findUniqueOrThrow({
      where: { id: rideId },
      include: {
        driver: { select: { id: true, name: true, phoneNumber: true, avatarUrl: true, driverProfile: { select: { rating: true } } } },
        vehicle: { select: { id: true, vehicleType: true, make: true, model: true, color: true, plateNumber: true } }
      }
    });

    if (!ride.driver || !ride.driver.driverProfile || !ride.vehicle) {
      throw new AppError('Accepted ride details could not be loaded.', 500);
    }

    return {
      rideId: ride.id,
      riderId: ride.riderId,
      otp: ride.otp,
      driver: {
        id: ride.driver.id,
        name: ride.driver.name,
        phoneNumber: ride.driver.phoneNumber,
        avatarUrl: ride.driver.avatarUrl,
        rating: ride.driver.driverProfile.rating
      },
      vehicle: {
        id: ride.vehicle.id,
        type: ride.vehicle.vehicleType,
        make: ride.vehicle.make,
        model: ride.vehicle.model,
        color: ride.vehicle.color,
        plateNumber: ride.vehicle.plateNumber
      }
    };
  }

  async acceptRide(driverId: string, rideId: string) {
    return prisma.$transaction(async (tx) => {
      const vehicle = await this.getEligibleDriverVehicle(tx, driverId);
      await this.assignSearchingRide(tx, rideId, driverId, vehicle);
      return this.getAcceptedRideDetails(tx, rideId);
    });
  }

}

export const rideService =  new RideService();
