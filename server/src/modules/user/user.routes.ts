import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {completeProfile, getUserProfile, getUserRides} from "./user.controller.js"

const router = express.Router();

router.get("/profile", authenticate, getUserProfile);
router.patch("/profile", authenticate, completeProfile);

router.get("/rides", authenticate, getUserRides);

export default router;