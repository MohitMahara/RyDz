import rateLimit from 'express-rate-limit';


export const otpRequestLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, 
    message: { status: 'fail', message: 'Too many attempts, please try again in 10 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, 
    message: { status: 'fail', message: 'Too many failed attempts, please generate a new otp.' },
    standardHeaders: true,
    legacyHeaders: false,
});