import { z } from 'zod';

export const completeProfileSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
    email: z.email().trim().toLowerCase().optional()
}).refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'Provide at least one profile field'
});
