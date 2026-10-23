import prisma from "../../config/db.js";
import * as userDTO from "./user.dto.js";
import type { RideStatus } from "../../generated/client/enums.js";

class UserService {
  // Sanitize user object by removing sensitive information like password
  // private sanitizeUser<T extends { password: string | null }>(user: T) {
  //     const { password: _, ...userWithoutPassword } = user;
  //     return userWithoutPassword;
  // }

  public async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return {
      user,
    };
  }

  // Complete the user's profile after phone number verification
  public async completeProfile(
    userId: string,
    profileData: userDTO.CompleteProfileDTO,
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(profileData.name !== undefined ? { name: profileData.name } : {}),
        ...(profileData.email !== undefined
          ? { email: profileData.email }
          : {}),
      },
    });

    return {
      user,
    };
  }

  public async userRides(
    userId: string,
    queryParams: userDTO.UserRidesQueryDTO,
  ) {
    let { status, page, limit, sortBy, sortOrder } = queryParams;
    const statusFilter: RideStatus | { in: RideStatus[] } = status === "ALL" ? {
            in: [
              "COMPLETED",
              "CANCELLED",
              "ACCEPTED",
              "ARRIVED",
              "IN_PROGRESS",
            ],
          } : status;

    const where = {
      riderId: userId,
      status: statusFilter,
    };

    const [rides, total] = await prisma.$transaction([
      prisma.ride.findMany({
        where,
        orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          pickupAddress: true,
          dropoffAddress: true,
          requestedVehicleType: true,
          status: true,
          estimatedFare: true,
          finalFare: true,
          distanceInKm: true,
          requestedAt: true,
          completedAt: true,
          cancelledAt: true,
          driver: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
          vehicle: {
            select: {
              vehicleType: true,
              make: true,
              model: true,
              color: true,
              plateNumber: true,
            },
          },
        },
      }),

      prisma.ride.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      rides,
      metadata: {
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          status,
          sortBy,
          sortOrder,
        },
      },
    };
  }
}

export const userService = new UserService();
