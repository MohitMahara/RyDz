import { catchAsync } from "../../shared/utils/catchAsync.util.js";
import type { Request, Response, NextFunction } from "express";
import { estimateRideSchema } from "./ride.schema.js";
import {rideService} from "./ride.service.js";

export const estimateRide = catchAsync(async (req : Request, res : Response, next: NextFunction) => {
   const parsedData = estimateRideSchema.parse(req.body);
   const {tripDetails, encodedPolyline, vehicles} = await rideService.estimateRide(parsedData);

   res.status(200).json({
    status : "success",
    message : "Ride estimated successfully",
    data : {
        tripDetails,
        encodedPolyline,
        vehicles
    }
   });
});