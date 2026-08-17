import http from 'http';
import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';
import { redis } from './config/redis.js';

const server = http.createServer(app);

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL connected successfully.');

        server.listen(env.PORT, () => {
            console.log(`RYDZ Backend running on port ${env.PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
};

startServer();

// --- Graceful Shutdown  ---
const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Initiating graceful shutdown...`);

    server.close(async () => {
        console.log('HTTP & WebSocket Server closed.');

        try {
            await prisma.$disconnect();
            console.log('PostgreSQL disconnected.');

            await redis.quit();
            console.log('Redis disconnected.');

            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error('Shutdown timed out, forcing exit.');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));