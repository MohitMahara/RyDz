import type z from "zod";
import {
    completeProfileSchema,
} from './user.schema.js';

export type CompleteProfileDTO = z.infer<typeof completeProfileSchema>;