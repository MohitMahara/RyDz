import express from "express";
import {authenticate} from "../../middlewares/auth.middleware.js";
import {estimateRide} from "./ride.controller.js";

const router = express.Router();

// router.use(authenticate);

router.post("/estimate",  estimateRide);


export default router;