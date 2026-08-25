import prisma  from '../../config/db.js';
import { AppError } from '../../shared/utils/AppError.util.js';
import {generateToken, generateRefreshToken} from './utils/jwt.util.js';
import * as authDTO from './auth.dto.js';
import { otpService } from '../../shared/services/otp.service.js';
// import {hashPassword} from '../../shared/utils/hash.util.js';

class AuthService {

    // Sanitize user object by removing sensitive information like password
    private sanitizeUser<T extends { password: string | null }>(user: T) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Request an OTP for phone number verification or registration
    public async requestPhoneOtp(Data : authDTO.RequestPhoneOtpDTO) {
        const {phoneNumber} = Data;
        const otp = await otpService.generateOtp(phoneNumber, 'PHONE_AUTHENTICATION');

    }

    // Verify the OTP for phone number verification or registration and authenticate the user
    public async verifyPhoneOtp( Data : authDTO.VerifyPhoneOtpDTO) {
        const {phoneNumber, otp} = Data;
        const isOtpValid = await otpService.verifyOtp(phoneNumber, 'PHONE_AUTHENTICATION', otp);

        if (!isOtpValid) {
            throw new AppError('Invalid or expired OTP', 401);
        }

        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber }
        });

        const user = existingUser ?? await prisma.user.create({
            data: {
                phoneNumber,
                isPhoneVerified: true
            }
        });

        if (!user.isPhoneVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isPhoneVerified: true }
            });
            user.isPhoneVerified = true;
        }

        const token = generateToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id);

        return {
            user: this.sanitizeUser(user),
            token,
            refreshToken,
            isNewUser: !existingUser
        };
    }

    
    // // Request an OTP for password reset
    // public async requestPasswordOtp(Data: authDTO.RequestPasswordOtpDTO) {
    //     const {phoneNumber} = Data;

    //     const user = await prisma.user.findUnique({
    //         where: { phoneNumber }
    //     });

    //     if (!user) {
    //         throw new AppError('Please enter a valid phone number', 404);
    //     }

    //     const otp = await otpService.generateOtp(phoneNumber, 'PASSWORD_RESET');

    // }

    // // Reset the user's password after verifying the OTP
    // public async resetPassword(Data : authDTO.ResetPasswordDTO) {
    //     const { phoneNumber, otp, password } = Data;
    //     const isOtpValid = await otpService.verifyOtp(phoneNumber, 'PASSWORD_RESET', otp);

    //     if (!isOtpValid) {
    //         throw new AppError('Invalid or expired OTP', 401);
    //     }

    //     const hashedPassword = await hashPassword(password);

    //     const user = await prisma.user.update({
    //         where: { phoneNumber },
    //         data: { password: hashedPassword }
    //     });

    //     return {
    //         user: this.sanitizeUser(user)
    //     };
    // }

}

export const authService = new AuthService();