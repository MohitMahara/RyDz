
export class KycService {
 
    public async validateDriverLicense(licenseNumber: string): Promise<'APPROVED' | 'REJECTED' | 'IN_PROGRESS'> {
        
        // Simulate network latency (2 seconds) to make the frontend loading states feel real
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (licenseNumber.startsWith('MOCK_PASS')) {
            return 'APPROVED';
        }
        
        if (licenseNumber.startsWith('MOCK_FAIL')) {
            return 'REJECTED';
        }

        // The Fallback Requires an admin to approve it manually via dashboard.
        return 'IN_PROGRESS';
    }

    public async validateVehicle(plateNumber: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 2000));

        return true;
    }
}

export const kycService = new KycService();