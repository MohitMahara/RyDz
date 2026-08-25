import { z } from 'zod';

const phoneNumberSchema = z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number, please enter a valid phone number');

const otpSchema = z.string().trim().regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

// const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must not exceed 72 characters');


export const requestPhoneOtpSchema = z.object({
    phoneNumber: phoneNumberSchema
});

export const verifyPhoneOtpSchema = z.object({
    phoneNumber: phoneNumberSchema,
    otp: otpSchema
});

// export const requestPasswordOtpSchema = z.object({
//     phoneNumber: phoneNumberSchema
// });

// export const resetPasswordSchema = z.object({
//     phoneNumber: phoneNumberSchema,
//     otp: otpSchema,
//     password: passwordSchema
// });