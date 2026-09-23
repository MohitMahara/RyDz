import {z} from "zod";
import {estimateRideSchema, bookRideSchema} from "./ride.schema.js";

export type estimateRideDTO = z.infer<typeof estimateRideSchema>;
export type bookRideDTO = z.infer<typeof bookRideSchema>;