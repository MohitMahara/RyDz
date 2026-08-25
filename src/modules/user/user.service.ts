import prisma  from '../../config/db.js';
import * as userDTO from './user.dto.js';

class UserService {

    // Sanitize user object by removing sensitive information like password
    private sanitizeUser<T extends { password: string | null }>(user: T) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Complete the user's profile after phone number verification
    public async completeProfile(userId: string, profileData: userDTO.CompleteProfileDTO) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: profileData
        });

        return {
            user: this.sanitizeUser(user)
        };
    }
}

export const userService = new UserService();