import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "../generated/client/client.js";
import env  from './env.js';

const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
});

export default prisma;