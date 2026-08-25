import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {completeProfile} from "./user.controller.js"

const router = express.Router();

// route for completing user profile after phone number verification. (update user profile)
router.patch("/profile", authenticate, completeProfile);

export default router;