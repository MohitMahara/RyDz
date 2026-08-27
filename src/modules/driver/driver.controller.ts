import type { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../shared/utils/catchAsync.util.js";
import {
    addVehicleSchema,
    createDriverProfileSchema,
    updateAvailabilitySchema,
    updateDriverProfileSchema,
    uuidParamSchema
} from "./driver.schema.js";
import { driverService } from "./driver.service.js";


export const createDriverProfile = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const parsedData = createDriverProfileSchema.parse(req.body);
    const userId = res.locals.userId as string;
    const { driverProfile, token, isNewAccount } = await driverService.createDriverProfile(userId, parsedData);

    res.status(201).json({
        status: "success",
        message: `Driver profile ${isNewAccount ? "created" : "recovered"} successfully`,
        token,
        data: { driverProfile }
    });
});

export const updateDriverProfile = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const parsedData = updateDriverProfileSchema.parse(req.body);
    const userId = res.locals.userId as string;
    const { driverProfile } = await driverService.updateDriverProfile(userId, parsedData);

    res.status(200).json({
        status: "success",
        message: "Driver profile updated successfully",
        data: { driverProfile }
    });
});

export const getDriverProfile = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const profile = await driverService.getProfile(userId);

    res.status(200).json({
        status: "success",
        data: profile
    });
});

export const deleteDriverProfile = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    await driverService.deleteDriverProfile(userId);

    res.status(200).json({
        status: "success",
        message : "Driver profile deleted successfully"
    });
});


export const initiateDriverKyc = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const { driverProfile, token } = await driverService.initiateKyc(userId);

    res.status(200).json({
        status: "success",
        message: "Driver KYC initiated successfully",
        token,
        data: { driverProfile }
    });
});

export const driverKycStatus = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const { status } = await driverService.getKycStatus(userId);

    res.status(200).json({
        status: "success",
        message: "Driver KYC status fetched successfully",
        KycStatus : status
    });
});

export const verifyDriverLicense = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const { verificationStatus, driverProfile } = await driverService.verifyLicense(userId);

    res.status(200).json({
        status: "success",
        message: "Driver license verification completed",
        data: { verificationStatus, driverProfile }
    });
});

export const addDriverVehicle = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const parsedData = addVehicleSchema.parse(req.body);
    const userId = res.locals.userId as string;
    const { vehicle, driverProfile } = await driverService.addVehicle(userId, parsedData);

    res.status(201).json({
        status: "success",
        message: "Vehicle added successfully",
        data: { vehicle, driverProfile }
    });
});

export const verifyDriverVehicle = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const {vehicleId} = uuidParamSchema("vehicleId").parse(req.params);
    const { vehicle, isVerified } = await driverService.verifyVehicle(userId, vehicleId!);

    res.status(200).json({
        status: "success",
        message: "Vehicle verification completed",
        data: { vehicle, isVerified }
    });
});

export const setActiveDriverVehicle = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const {vehicleId} = uuidParamSchema("vehicleId").parse(req.params);    
    const { driverProfile } = await driverService.setActiveVehicle(userId, vehicleId!);

    res.status(200).json({
        status: "success",
        message: "Active vehicle updated successfully",
        data: { driverProfile }
    });
});

export const deleteDriverVehicle = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const {vehicleId} = uuidParamSchema("vehicleId").parse(req.params);    
    const { driverProfile } = await driverService.deleteVehicle(userId, vehicleId!);

    res.status(200).json({
        status: "success",
        message: "Vehicle deleted successfully",
        data: { driverProfile }
    });
});

export const updateDriverAvailability = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const parsedData = updateAvailabilitySchema.parse(req.body);
    const userId = res.locals.userId as string;
    const { driverProfile } = await driverService.updateAvailability(userId, parsedData);

    res.status(200).json({
        status: "success",
        message: "Driver availability updated successfully",
        data: { driverProfile }
    });
});

export const getDriverAvailability = catchAsync(async(req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.userId as string;
    const availability = await driverService.getAvailability(userId);

    res.status(200).json({
        status: "success",
        data: availability
    });
});
