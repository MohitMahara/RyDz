import axios from 'axios';
import env from "../../config/env.js"

 class RoutingService {
  private readonly baseUrl = env.OSRM_ROUTING_URL;

  private readonly RATES = {
    BIKE: { base: 20, perKm: 5.5, perMin: 0.5, minFare: 30 },
    AUTO: { base: 30, perKm: 11.0, perMin: 0.75, minFare: 50 },
    CAB_ECONOMY: { base: 55, perKm: 15.0, perMin: 1.0, minFare: 80 },
    CAB_PREMIUM: { base: 80, perKm: 17.0, perMin: 1.5, minFare: 110 }
  };

  async getRouteDetails(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number) {
    const url = `${this.baseUrl}/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}`;
    const response = await axios.get(url, {
      params: { overview: 'full', geometries: 'geojson' }
    });

    if (response.data.code !== 'Ok' || !response.data.routes.length) {
      throw new Error('OSRM Route not found');
    }
    
    const routes = response.data.routes[0];

    // adjust distance and duration for traffic
    const distanceKm = Number((routes.distance/1000).toFixed(1));
    let durationMin = Math.round((routes.duration) / 60);
     

    // Force Indian standar time for accurate peak hour calculation
    const istHourString = new Date().toLocaleString("en-US", { 
      timeZone: "Asia/Kolkata", 
      hour: 'numeric', 
      hour12: false 
    });

    const currentHour = parseInt(istHourString, 10);
        
     if(currentHour >= 7 && currentHour <= 11){  // Morning peak hours
       durationMin *= 1.9;
     }

     if(currentHour >= 12 && currentHour <= 15){  // Afternoon peak hours
        durationMin *= 1.6;
     }

     if(currentHour >= 16 && currentHour <= 21){  // Evening peak hours
        durationMin *= 1.8;
     }

     routes.distance = distanceKm; 
     routes.duration = durationMin;

    return routes;
  }


  async calculateFare(distanceKm: number, durationMin: number) {
    const estimates: Record<string, number> = {};

    for (const [vehicle, rates] of Object.entries(this.RATES)) {
      const total = rates.base + (distanceKm * rates.perKm) + (durationMin * rates.perMin);
      estimates[vehicle] = Math.max(Math.round(total), rates.minFare);
    }

    return {
      estimates
    };
  }
}


export const routingService = new RoutingService();