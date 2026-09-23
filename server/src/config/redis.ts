import { Redis } from 'ioredis';
import env from "./env.js";

const redisUrl = env.REDIS_URL;

export const redis = new Redis(redisUrl);

redis.on('connect', () => {
    console.log('Redis connected successfully.');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});