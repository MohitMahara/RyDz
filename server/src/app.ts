import express from "express";  
import type { Request, Response} from 'express';
import cors from 'cors';
import globalErrorHandler from './middlewares/error.middleware.js';
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import driverRoutes from "./modules/driver/driver.routes.js";
import rideRoutes from "./modules/ride/ride.routes.js";
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 100,
    message: { status: 'fail', message: 'API rate limit exceeded.' }
});

const app = express();

app.use(apiLimiter);
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the RyDz Backend' });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'online', 
        service: 'rydz-backend',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes); 
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/rides', rideRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use(globalErrorHandler);

export default app;