import type { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { AppError } from '../shared/utils/AppError.util.js';
import { catchAsync } from '../shared/utils/catchAsync.util.js';
import env  from '../config/env.js';

export const verifyBot = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (env.NODE_ENV === 'development') {
        return next();
    }

    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return next(new AppError('Security token missing. Please refresh the page.', 403));
    }

    const googleUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${env.RECAPTCHA_SECRET}&response=${recaptchaToken}`;
    const response = await axios.post(googleUrl);
    const { success, score } = response.data;

    if (!success || score < 0.5) {
        return next(new AppError('Suspicious activity detected. Access denied.', 403));
    }

    next();
});