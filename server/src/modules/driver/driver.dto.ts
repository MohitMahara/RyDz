import type z from "zod";
import {
    addVehicleSchema,
    createDriverProfileSchema,
    updateAvailabilitySchema,
    updateDriverProfileSchema
} from "./driver.schema.js";

export type CreateDriverProfileDTO = z.infer<typeof createDriverProfileSchema>;
export type UpdateDriverProfileDTO = z.infer<typeof updateDriverProfileSchema>;
export type AddVehicleDTO = z.infer<typeof addVehicleSchema>;
export type UpdateAvailabilityDTO = z.infer<typeof updateAvailabilitySchema>;