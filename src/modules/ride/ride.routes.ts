import express from "express";
import {authenticate} from "../../middlewares/auth.middleware.js";
import {estimateRide, bookRide} from "./ride.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/estimate",  estimateRide);

router.post("/book", bookRide)


export default router;