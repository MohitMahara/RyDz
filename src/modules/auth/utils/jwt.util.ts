import jwt from 'jsonwebtoken';
import env from '../../../config/env.js';


/**
 * Generates a JWT token for the given user ID and role.
 * @param userId User's unique ID
 * @param role Role of the user, e.g. USER or ADMIN
 * @returns A jwt token
 */

export const generateToken = (userId: string, role: string): string => {

    const payload = {
        id: userId,
        role: role
    };

    const token = jwt.sign(
        payload, 
        env.JWT_SECRET, 
        {
            expiresIn: '15m',
        }
    );

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
