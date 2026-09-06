import {z} from "zod";

export const estimateRideSchema = z.object({
    pick_up_lat : z.number().min(-90).max(90, {message : "Latitude must be between -90 and 90"}),
    pick_up_lng : z.number().min(-180).max(180, {message : "Longitude must be between -180 and 180"}),
    drop_off_lat : z.number().min(-90).max(90, {message : "Latitude must be between -90 and 90"}),
    drop_off_lng : z.number().min(-180).max(180, {message : "Longitude must be between -180 and 180"}),
});