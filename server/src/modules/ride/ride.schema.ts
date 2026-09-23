import {z} from "zod";

export const estimateRideSchema = z.object({
    pick_up_lat : z.number().min(-90).max(90, {message : "Latitude must be between -90 and 90"}),
    pick_up_lng : z.number().min(-180).max(180, {message : "Longitude must be between -180 and 180"}),
    drop_off_lat : z.number().min(-90).max(90, {message : "Latitude must be between -90 and 90"}),
    drop_off_lng : z.number().min(-180).max(180, {message : "Longitude must be between -180 and 180"}),
});


const vehicleTypes = z.enum(["BIKE", "AUTO", "CAB_ECONOMY", "CAB_PREMIUM"],
  {
    error: "Invalid vehicle type.",
  }
);

const paymentMethods = z.enum(["CASH", "UPI", "CARD"],
    { 
        error: "Invalid payment method."
    }
);

export const bookRideSchema = z.object({
    pick_up_lat : z.number().min(-90).max(90, {message : "Latitude must be between -90 and 90"}),
    pick_up_lng : z.number().min(-180).max(180, {message : "Longitude must be between -180 and 180"}),
    pick_up_address : z.string().min(1, {message : "Pickup address is required"}),
    drop_off_lat : z.number().min(-90).max(90, {message : "Latitude must be between -90 and 90"}),
    drop_off_lng : z.number().min(-180).max(180, {message : "Longitude must be between -180 and 180"}),
    drop_off_address : z.string().min(1, {message : "Dropoff address is required"}),
    requested_vehicle_type : vehicleTypes,
    payment_method : paymentMethods,
});