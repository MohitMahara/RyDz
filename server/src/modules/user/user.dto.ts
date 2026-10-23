import type z from "zod";
import {
    completeProfileSchema,
    userRidesQuerySchema
} from './user.schema.js';

export type CompleteProfileDTO = z.infer<typeof completeProfileSchema>;

export type UserRidesQueryDTO = z.infer<typeof userRidesQuerySchema>;