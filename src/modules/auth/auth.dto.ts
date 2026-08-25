import type z from "zod";
import {
    requestPhoneOtpSchema,
    verifyPhoneOtpSchema,
    // requestPasswordOtpSchema,
    // resetPasswordSchema,
} from './auth.schema.js';

export type RequestPhoneOtpDTO = z.infer<typeof requestPhoneOtpSchema>;
export type VerifyPhoneOtpDTO = z.infer<typeof verifyPhoneOtpSchema>;
// export type RequestPasswordOtpDTO = z.infer<typeof requestPasswordOtpSchema>;
// export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;