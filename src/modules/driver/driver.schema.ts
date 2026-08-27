import { z } from "zod";

const vehicleTypeSchema = z.enum(["BIKE", "AUTO", "CAB_ECONOMY", "CAB_PREMIUM"]);

export const createDriverProfileSchema = z.object({
    licenseNumber: z.string().trim().min(4, "License number is required").max(40),
    licenseExpiryDate: z.coerce.date()
});

export const updateDriverProfileSchema = z.object({
    licenseNumber: z.string().trim().min(4, "License number is required").max(40).optional(),
    licenseExpiryDate: z.coerce.date().optional()
}).refine((data) => data.licenseNumber !== undefined || data.licenseExpiryDate !== undefined, {
    message: "At least one field is required to perform edit"
});

export const addVehicleSchema = z.object({
    vehicleType: vehicleTypeSchema,
    make: z.string().trim().min(2, "Vehicle make is required").max(60),
    model: z.string().trim().min(1, "Vehicle model is required").max(60),
    plateNumber: z.string().trim().min(4, "Plate number is required").max(20).toUpperCase(),
    color: z.string().trim().min(2, "Vehicle color is required").max(30)
});

export const updateAvailabilitySchema = z.object({
    isAvailable: z.boolean()
});

export const uuidParamSchema = (paramName: string) =>
  z.object({
    [paramName]: z.uuid(),
  });