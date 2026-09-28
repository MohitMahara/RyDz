import express from "express";
import { authenticate }  from "../../middlewares/auth.middleware.js";
import { requireApprovedDriver, requireDriver } from "../../middlewares/driver.middleware.js";
import {
    addDriverVehicle,
    createDriverProfile,
    deleteDriverVehicle,
    driverKycStatus,
    getDriverAvailability,
    getDriverProfile,
    getDriverRides,
    initiateDriverKyc,
    setActiveDriverVehicle,
    updateDriverAvailability,
    updateDriverProfile,
    verifyDriverLicense,
    verifyDriverVehicle,
    deleteDriverProfile
} from "./driver.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/profile", createDriverProfile);
router.get("/profile", getDriverProfile);

router.use(requireDriver);

router.get("/rides", getDriverRides);
router.patch("/profile",  updateDriverProfile);
router.delete("/profile", deleteDriverProfile);


router.post("/kyc/initiate",  initiateDriverKyc);
router.get("/kyc/status",  driverKycStatus);

router.post("/license/verify",  verifyDriverLicense);

router.post("/vehicles",  addDriverVehicle);
router.post("/vehicles/:vehicleId/verify",  verifyDriverVehicle);
router.patch("/vehicles/:vehicleId/active",  setActiveDriverVehicle);
router.delete("/vehicles/:vehicleId",  deleteDriverVehicle);

router.patch("/availability", requireApprovedDriver, updateDriverAvailability);
router.get("/availability",  getDriverAvailability);


export default router;
