import { redis } from '../../config/redis.js';
import crypto from 'crypto';
import env from '../../config/env.js';

export type OtpType = 'PHONE_AUTHENTICATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'RIDE_VERIFICATION';

class OtpService {
    private readonly OTP_TTL = 300;

    /**
     * Generates a random 6-digit OTP and securely stores it in Redis.
     * @param identifier - The user's phone number or email
     * @param type - The specific purpose of this OTP
     * @returns The generated 6-digit OTP string
     */
    public async generateOtp(identifier: string, type: OtpType): Promise<string> {

        if (env.NODE_ENV === 'development') {
            const mockOtp = '123456';
            await redis.set(`otp:${type}:${identifier}`, mockOtp, 'EX', this.OTP_TTL);
            return mockOtp;
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const redisKey = `otp:${type}:${identifier}`;

        await redis.set(redisKey, otp, 'EX', this.OTP_TTL);
        return otp;
    }

    /**
     * Verifies if the provided OTP matches the one stored in Redis.
     * @param identifier - The user's phone number or email
     * @param type - The specific purpose of this OTP
     * @param submittedOtp - The code typed by the user on the frontend
     * @returns boolean indicating success or failure
     */
    public async verifyOtp(identifier: string, type: OtpType, submittedOtp: string): Promise<boolean> {
        const redisKey = `otp:${type}:${identifier}`;
        const validOtp = await redis.get(redisKey);

        if (!validOtp || validOtp !== submittedOtp) {
            return false;
        }

        await redis.del(redisKey);
        return true;
    }
}

export const otpService = new OtpService();