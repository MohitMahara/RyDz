import type { Request, Response, NextFunction } from 'express';
import {catchAsync}  from '../../shared/utils/catchAsync.util.js';
import { authService } from './auth.service.js';
import
    { 
    requestPhoneOtpSchema,
    verifyPhoneOtpSchema,
    //  requestPasswordOtpSchema, 
    //  resetPasswordSchema 
    } from './auth.schema.js';


// Controller for requesting an OTP for phone number verification or registration
export const requestPhoneOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsedData = requestPhoneOtpSchema.parse(req.body);
    await authService.requestPhoneOtp(parsedData);

    res.status(200).json({
        status: 'success',
        message : "Otp is sent to your entered mobile number"
    });
});


// Controller for verifying the OTP for phone number verification or registration and authenticating the user
export const verifyPhoneOtpAndAuthenticate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsedData = verifyPhoneOtpSchema.parse(req.body);
    const { user, token, isNewUser, refreshToken } = await authService.verifyPhoneOtp(parsedData);

    // Attach the Refresh Token to an HttpOnly, Secure cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,    
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    });

    res.status(200).json({
        status: 'success',
        message : "Otp is verified and user is authenticated successfully",
        token,
        data: { user, isNewUser }
    });
});


// Controller for requesting an OTP for password reset
// export const requestPasswordOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const parsedData = requestPasswordOtpSchema.parse(req.body);
//     await authService.requestPasswordOtp(parsedData);

//     res.status(200).json({
//         status: 'success',
//         message : "If your mobile number is registered then you will receive an OTP to your entered mobile number",
//     });
// });

// Controller for resetting the password using phone number and OTP
// export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const parsedData = resetPasswordSchema.parse(req.body);
//     await authService.resetPassword(parsedData);

//     res.status(200).json({
//         status: 'success',
//         message : "Password is reset successfully",
//     });
// });