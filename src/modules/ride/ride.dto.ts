import {z} from "zod";
import {estimateRideSchema} from "./ride.schema.js";

export type estimateRideDTO = z.infer<typeof estimateRideSchema>;