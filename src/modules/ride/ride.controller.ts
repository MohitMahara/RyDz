import { catchAsync } from "../../shared/utils/catchAsync.util.js";
import type { Request, Response, NextFunction } from "express";
import { estimateRideSchema, bookRideSchema } from "./ride.schema.js";
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

export const bookRide = catchAsync(async (req : Request, res : Response, next: NextFunction) => {
   const parsedData = bookRideSchema.parse(req.body);
   const riderId = res.locals.userId;
   const {rideId, otp, broadcastedTo } = await rideService.bookRide(riderId, parsedData);

   res.status(200).json({
    status : "success",
    message : "Searching for Drivers",
    data : {
        rideId,
        otp,
        broadcastedTo
    }
   });
});