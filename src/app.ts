import express from "express";  
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app = express();

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


export default app;