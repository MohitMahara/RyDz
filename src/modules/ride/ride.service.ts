import type { estimateRideDTO } from "./ride.dto.js";
import { routingService } from "../../shared/services/routing.service.js";
import {redis} from "../../config/redis.js";

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

}

export const rideService =  new RideService();