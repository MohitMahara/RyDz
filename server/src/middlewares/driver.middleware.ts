
import type { Request, Response, NextFunction } from 'express';

export const requireDriver = (req: Request, res: Response, next: NextFunction) => {
    const driverContext = res.locals?.driver;

    if (!driverContext) {
        return res.status(403).json({ 
            message: 'Access denied. You do not have a driver profile. Please create a driver profile before initiating kyc.' 
        });
    }

    next();
};


export const requireApprovedDriver = (req: Request, res: Response, next: NextFunction) => {
    const driverContext = res.locals?.driver;

    if (!driverContext) {
        return res.status(403).json({ 
            message: 'Access denied. You do not have a driver profile.' 
        });
    }

    if (driverContext.kycStatus !== 'APPROVED') {
        return res.status(403).json({ 
            message: `Access denied. Your KYC status is currently: ${driverContext.kycStatus}` 
        });
    }

    next();
};