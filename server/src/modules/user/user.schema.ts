import { z } from 'zod';

export const completeProfileSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80).optional(),
    email: z.email().trim().toLowerCase().optional()
}).refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'Provide at least one profile field'
});


export const userRidesQuerySchema = z.object({
  status: z.string().transform((status => status.toUpperCase())).pipe(z.enum(["ALL", "COMPLETED", "CANCELLED"])).default("ALL"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  sortBy: z.enum(["requestedAt"]).default("requestedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});