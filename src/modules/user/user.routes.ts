import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {completeProfile, getUserProfile} from "./user.controller.js"

const router = express.Router();

router.get("/profile", authenticate, getUserProfile);
router.patch("/profile", authenticate, completeProfile);

export default router;