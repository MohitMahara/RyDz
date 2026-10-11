import jwt from 'jsonwebtoken';
import env from '../../../config/env.js';
import type { User, DriverProfile } from '../../../generated/client/client.js';
import {AppError} from '../../../shared/utils/AppError.util.js';

type JwtPayload = {
    id: string,
    role: "USER" | "ADMIN",    
    driver: {
      profileId: string,
      kycStatus: "NOT_STARTED" | "IN_PROGRESS" | "APPROVED" | "REJECTED",
    } | null
}


type UserWithDriver = User & {
    driverProfile: DriverProfile | null;
};

export const generateToken = (user : UserWithDriver): string => {

    const payload: JwtPayload = {
        id: user.id,
        role: user.role,
        driver: user.driverProfile ? {
            profileId: user.driverProfile.id,
            kycStatus: user.driverProfile.kycStatus
        } : null
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {expiresIn: '15m',});

    return token;
};


export const generateRefreshToken = (userId: string): string => {
    const payload = { id: userId };

    return jwt.sign(
        payload,
        env.JWT_REFRESH_SECRET,
        {
            expiresIn: '30d',
        }
    );
};

export const verifyRefreshToken = (refreshToken: string): {id : string} => {
    try{
     const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
     return decoded;
    }catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
}