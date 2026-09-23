import express from "express";
import * as authController from "./auth.controller.js";
import { verifyBot } from "../../middlewares/security.middleware.js";
import {otpRequestLimiter, otpVerifyLimiter} from '../../middlewares/rateLimit.middleware.js';

const router = express.Router();

// routes for authentication using phone number. (register/login)
router.post("/phone/request-otp", otpRequestLimiter, verifyBot, authController.requestPhoneOtp);
router.post("/phone/verify-otp", otpVerifyLimiter, authController.verifyPhoneOtpAndAuthenticate);

// routes for setting and resetting password using phone number and otp. (forgot password)
// router.post("/password/request-otp", otpRequestLimiter, verifyBot, authController.requestPasswordOtp);
// router.patch("/password/reset", otpVerifyLimiter, authController.resetPassword);

export default router;