import type { Request, Response, NextFunction } from 'express';
import {catchAsync}  from '../../shared/utils/catchAsync.util.js';
import { userService } from './user.service.js';
import { completeProfileSchema} from './user.schema.js';


// Controller for completing the user profile after phone number verification
export const completeProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsedData = completeProfileSchema.parse(req.body);
    const userId = res.locals.userId as string;
    const { user } = await userService.completeProfile(userId, parsedData);

    res.status(200).json({
        status: 'success',
        message : "User profile is updated successfully",
        data: { user }
    });
});