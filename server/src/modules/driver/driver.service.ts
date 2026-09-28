import prisma from "../../config/db.js";
import { AppError } from "../../shared/utils/AppError.util.js";
import { kycService } from "../../shared/services/kyc.service.js";
import { generateToken } from "../auth/utils/jwt.util.js";
import type { AddVehicleDTO, CreateDriverProfileDTO, UpdateAvailabilityDTO, UpdateDriverProfileDTO } from "./driver.dto.js";
import { VehicleStatus } from "../../generated/client/enums.js";

class DriverService {

    // Fetches the driver's vehicles (excluding deleted ones) and the vehicle currently selected for rides.
    private readonly driverProfileInclude = {
        vehicles: {
            where: { status: { not: VehicleStatus.DELETED } },
            orderBy: { createdAt: "desc" as const }
        },
        activeVehicle: true
    };

    // Returns user's driver profile
    private async getRequiredDriverProfile(userId: string) {
        const driverProfile = await prisma.driverProfile.findUnique({
            where: { userId },
            include: {
                activeVehicle: true
            }
        });

        if (!driverProfile) {
            throw new AppError("Driver profile not found", 404);
        }

        return driverProfile;
    }

    // Returns a driver's vehicle using the driver's profile ID and vehicle ID.
    private async getOwnedVehicle(driverProfileId: string, vehicleId: string) {
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                driverProfileId,
                status: { not: "DELETED" },
                deletedAt: null
            }
        });

        if (!vehicle) {
            throw new AppError("Vehicle not found", 404);
        }

        return vehicle;
    }

   // Checks whether the driver meets all the required conditions to accept rides.
    private driverCanGoOnline(driverProfile: Awaited<ReturnType<typeof this.getRequiredDriverProfile>>) {
        if (driverProfile.kycStatus !== "APPROVED") {
            throw new AppError("Driver KYC must be approved before going online", 403);
        }

        if (!driverProfile.licenseVerified) {
            throw new AppError("Driver license must be verified before going online", 403);
        }

        if (!driverProfile.activeVehicle) {
            throw new AppError("Please select an active vehicle before going online", 400);
        }

        if (driverProfile.activeVehicle.status !== "ACTIVE" || driverProfile.activeVehicle.deletedAt) {
            throw new AppError("Active vehicle is not available for rides", 400);
        }

        if (!driverProfile.activeVehicle.isVerified) {
            throw new AppError("Active vehicle must be verified before going online", 403);
        }
    }

    // Creates Driver Profile
    public async createDriverProfile(userId: string, driverData: CreateDriverProfileDTO) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { driverProfile: true }
        });

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if(user.driverProfile && user.driverProfile.deletedAt){
            const driverProfile = await prisma.driverProfile.update({
                where : {userId},
                data : {
                    deletedAt : null,
                    kycStatus : "NOT_STARTED",
                    isAvailable : false
                }
            })

            const updatedUser = await prisma.user.findUniqueOrThrow({
              where: { id: userId },
              include: { driverProfile: true }
            });

            return {
               driverProfile,
               token: generateToken(updatedUser),
               isNewAccount: false
            };
        }

        if (user.driverProfile) {
            throw new AppError("Driver profile already exists for this user", 409);
        }

        const driverProfile = await prisma.driverProfile.create({
            data: {
                userId,
                licenseNumber: driverData.licenseNumber,
                ...(driverData.licenseExpiryDate ? { licenseExpiryDate: driverData.licenseExpiryDate } : {}),
                licenseVerified: false,
                kycStatus: "NOT_STARTED",
                isAvailable: false
            },
            include: this.driverProfileInclude
        });

        const updatedUser = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { driverProfile: true }
        });

        return {
            driverProfile,
            token: generateToken(updatedUser),
            isNewAccount: true
        };
    }

    // Updates Driver Profile
    public async updateDriverProfile(userId: string, driverData: UpdateDriverProfileDTO) {
        const driverProfile = await this.getRequiredDriverProfile(userId);

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: {
                ...(driverData.licenseNumber ? { licenseNumber: driverData.licenseNumber } : {}),
                ...(driverData.licenseExpiryDate ? { licenseExpiryDate: driverData.licenseExpiryDate } : {}),
                licenseVerified: false,
                isAvailable: false
            },
            include: this.driverProfileInclude
        });

        return { driverProfile: updatedDriverProfile };
    }
  
    // Returns driver's profile along with all non deleted vehicles
    public async getProfile(userId: string) {
        const driverProfile = await prisma.driverProfile.findUnique({
            where: { userId },
            select: {
                id: true,
                licenseNumber: true,
                licenseExpiryDate: true,
                licenseVerified: true,
                kycStatus: true,
                isAvailable: true,
                activeVehicleId: true,
                createdAt: true,
                updatedAt: true,
                activeVehicle: true,
                vehicles: {
                    where: { status: { not: "DELETED" } },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        vehicleType: true,
                        make: true,
                        model: true,
                        plateNumber: true,
                        color: true,
                        status: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });

        return {
            hasDriverProfile: Boolean(driverProfile),
            driverProfile
        };
    }


    public async deleteDriverProfile(userId: string){
        const driverProfile = await prisma.driverProfile.findUnique({
            where : {userId}
        })

        if(!driverProfile || driverProfile.deletedAt){
            throw new AppError("No driver profile found for this user", 404);
        }

        await prisma.driverProfile.update({
            where : {userId},
            data : {
                deletedAt: new Date()
            }
        })

    }

    // Initiates driver's kyc
    public async initiateKyc(userId: string) {
        const driverProfile = await prisma.driverProfile.findUnique({
            where: { userId }
        });

        if (!driverProfile) {
            throw new AppError("Driver profile not found", 404);
        }

        if (driverProfile.kycStatus === "APPROVED") {
            throw new AppError("Driver KYC is already approved", 409);
        }

        const nextKycStatus = await kycService.validateDriverLicense(driverProfile.licenseNumber);

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: {
                kycStatus: nextKycStatus,
                licenseVerified: nextKycStatus === "APPROVED",
                isAvailable: false
            },
            include: this.driverProfileInclude
        });

        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { driverProfile: true }
        });

        return {
            driverProfile: updatedDriverProfile,
            token: generateToken(user)
        };
    }

    // Verifies Driver's license.
    public async verifyLicense(userId: string) {
        const driverProfile = await this.getRequiredDriverProfile(userId);
        const verificationStatus = await kycService.validateDriverLicense(driverProfile.licenseNumber);

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: {
                licenseVerified: verificationStatus === "APPROVED",
            },
            include: this.driverProfileInclude
        });

        return {
            verificationStatus,
            driverProfile: updatedDriverProfile
        };
    }

    // Adds Driver Vehicle
    public async addVehicle(userId: string, vehicleData: AddVehicleDTO) {
        const driverProfile = await this.getRequiredDriverProfile(userId);

        const existingVehicleCount = await prisma.vehicle.count({
            where: {
                driverProfileId: driverProfile.id,
                status: { not: "DELETED" }
            }
        });

        const vehicle = await prisma.vehicle.create({
            data: {
                ...vehicleData,
                driverProfileId: driverProfile.id,
                status: "ACTIVE",
                isVerified: false
            }
        });

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: existingVehicleCount === 0 ? { activeVehicleId: vehicle.id } : {},
            include: this.driverProfileInclude
        });

        return { vehicle, driverProfile: updatedDriverProfile };
    }

    // Verifies Vehicle and return's a mock verification status
    public async verifyVehicle(userId: string, vehicleId: string) {
        const driverProfile = await this.getRequiredDriverProfile(userId);
        const vehicle = await this.getOwnedVehicle(driverProfile.id, vehicleId);
        const isVerified = await kycService.validateVehicle(vehicle.plateNumber);

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { isVerified }
        });

        return { vehicle: updatedVehicle, isVerified };
    }

    // Sets Vehicle active for rides
    public async setActiveVehicle(userId: string, vehicleId: string) {
        const driverProfile = await this.getRequiredDriverProfile(userId);
        const vehicle = await this.getOwnedVehicle(driverProfile.id, vehicleId);

        if (!vehicle.isVerified) {
            throw new AppError("Vehicle must be verified before it can be selected as active", 400);
        }

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: { activeVehicleId: vehicle.id },
            include: this.driverProfileInclude
        });

        return { driverProfile: updatedDriverProfile };
    }

    // Deletes vehicle
    public async deleteVehicle(userId: string, vehicleId: string) {
        const driverProfile = await this.getRequiredDriverProfile(userId);
        const vehicle = await this.getOwnedVehicle(driverProfile.id, vehicleId);
        const isActiveVehicle = driverProfile.activeVehicleId === vehicle.id;

        await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
                status: "DELETED",
                deletedAt: new Date()
            }
        });

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: {
                ...(isActiveVehicle ? { activeVehicleId: null, isAvailable: false } : {})
            },
            include: this.driverProfileInclude
        });

        return { driverProfile: updatedDriverProfile };
    }

    // Updates driver's availability for taking rides.
    public async updateAvailability(userId: string, availabilityData: UpdateAvailabilityDTO) {
        const driverProfile = await prisma.driverProfile.findUnique({
            where: { userId },
            include: {
                activeVehicle: true
            }
        });

        if (!driverProfile) {
            throw new AppError("Driver profile not found", 404);
        }

        const activeDriverRide = await prisma.ride.findFirst({
            where: {
                driverId: userId,
                status: { in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] }
            },
            select: { id: true }
        });

        if (activeDriverRide) {
            throw new AppError("Availability cannot be changed during an active driver ride", 409);
        }

        const activeRiderRide = await prisma.ride.findFirst({
            where: {
             riderId: userId,
             status: { in: ["SEARCHING", "ACCEPTED", "ARRIVED", "IN_PROGRESS"] }
            },
            select: { id: true }
        });

        if (activeRiderRide) {
          throw new AppError("Finish or cancel your rider ride before going online", 409);
        }

        if (availabilityData.isAvailable) {
            this.driverCanGoOnline(driverProfile);
        }

        const updatedDriverProfile = await prisma.driverProfile.update({
            where: { id: driverProfile.id },
            data: { isAvailable: availabilityData.isAvailable },
            include: this.driverProfileInclude
        });

        return { driverProfile: updatedDriverProfile };
    }

    // Return the status of driver's availability for taking rides.
    public async getAvailability(userId: string) {
        const driverProfile = await this.getRequiredDriverProfile(userId);

        return {
            isAvailable: driverProfile.isAvailable,
            activeVehicleId: driverProfile.activeVehicleId
        };
    }

    // Returns driver profile's kyc status 
    public async getKycStatus(userId: string){

       const driverProfile  = await prisma.driverProfile.findUnique({
          where : {userId},
       })

       if(!driverProfile){
        throw new AppError("No driver profile found for this user. Please create a driver profile first", 404);
       }

       const status = driverProfile.kycStatus;

       return {status};
    }

    public async getRides(userId: string) {
        const rides = await prisma.ride.findMany({
            where: { driverId: userId },
            orderBy: { requestedAt: "desc" },
            select: {
                id: true,
                pickupAddress: true,
                dropoffAddress: true,
                distanceInKm: true,
                estimatedFare: true,
                finalFare: true,
                status: true,
                requestedAt: true,
                rider: { select: { name: true } },
                vehicle: { select: { vehicleType: true } }
            }
        });

        const activeRide = rides.find((ride) => ["ACCEPTED", "ARRIVED", "IN_PROGRESS"].includes(ride.status)) ?? null;
        const history = rides.filter((ride) => ["COMPLETED", "CANCELLED"].includes(ride.status));
        const completedRides = history.filter((ride) => ride.status === "COMPLETED");

        return {
            activeRide,
            history,
            stats: {
                completedRideCount: completedRides.length,
                earnings: completedRides.reduce((total, ride) => total + (ride.finalFare ?? ride.estimatedFare), 0)
            }
        };
    }

}

export const driverService = new DriverService();