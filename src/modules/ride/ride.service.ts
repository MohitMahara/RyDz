import type { estimateRideDTO, bookRideDTO } from "./ride.dto.js";
import { routingService } from "../../shared/services/routing.service.js";
import {redis} from "../../config/redis.js";
import prisma from "../../config/db.js";
import { otpService } from "../../shared/services/otp.service.js";
import { getIO } from "../../config/socket.js";

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

}

export const rideService =  new RideService();