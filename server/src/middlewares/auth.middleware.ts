import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AppError } from '../shared/utils/AppError.util.js';

type JwtPayload = {
    id: string;
    role?: string;
    driver : {
      profileId : string,
      kycStatus : "NOT_STARTED" | "IN_PROGRESS" | "APPROVED" | "REJECTED"
    } | null
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
        return next(new AppError('Authentication token is required', 401));
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        return next(new AppError('Authentication token is required', 401));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        res.locals.userId = decoded.id;
        res.locals.userRole = decoded.role;
        res.locals.driver = decoded.driver ?? null;
        return next();
    } catch {
        return next(new AppError('Invalid or expired authentication token', 401));
    }
};
