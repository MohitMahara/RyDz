import prisma  from '../../config/db.js';
import * as userDTO from './user.dto.js';

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
            user
        };
    }

    // Complete the user's profile after phone number verification
    public async completeProfile(userId: string, profileData: userDTO.CompleteProfileDTO) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(profileData.name !== undefined ? { name: profileData.name } : {}),
                ...(profileData.email !== undefined ? { email: profileData.email } : {})
            }
        });

        return {
            user
        };
    }


    public async userRides(userId: string) {
 
    const rides = await prisma.ride.findMany({
        where: { riderId: userId },
        orderBy: { requestedAt: "desc" },
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
        });

        return {rides};
    }
}

export const userService = new UserService();
