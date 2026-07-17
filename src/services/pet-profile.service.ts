import PetProfile, { IPetProfile } from '../models/PetProfile.js';
import { dynamicQRRepository } from '../repositories/dynamic-qr.repository.js';
import User from '../models/User.js';
import { SetupPetProfileDto } from '../dto/pet-profile.dto.js';
import { uploadToCloudinary } from '../utils/cloudinary.util.js';

class PetProfileService {
    async setupPetProfile(userId: string, dto: SetupPetProfileDto, imageBuffer?: Buffer): Promise<IPetProfile> {
        // 1. Verify QR is unassigned
        const qr = await dynamicQRRepository.findByToken(dto.token);
        if (!qr) {
            throw new Error('QR code not found');
        }
        
        // Wait, if it's already assigned to this user, we might be updating it? 
        // Let's assume this endpoint is for initial setup.
        if (qr.status !== 'unassigned') {
            // Check if it belongs to the user, if so, we can just update it.
            if (String(qr.owner_id) !== String(userId)) {
                throw new Error('This QR code is already assigned to someone else.');
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Handle Image Upload if provided
        let profile_photo_url = undefined;
        if (imageBuffer) {
            profile_photo_url = await uploadToCloudinary(imageBuffer);
        }

        let is_vaccinated = false;
        if (dto.is_vaccinated === 'true' || dto.is_vaccinated === true) is_vaccinated = true;

        const profileData = {
            ...dto,
            owner_id: user._id,
            qr_token: dto.token,
            is_vaccinated,
        };

        if (profile_photo_url) {
            (profileData as any).profile_photo_url = profile_photo_url;
        }

        // Check if pet profile already exists for this token
        let petProfile = await PetProfile.findOne({ qr_token: dto.token });
        
        if (petProfile) {
            if (String(petProfile.owner_id) !== String(userId)) {
                throw new Error('Unauthorized to edit this pet profile');
            }
            // Update existing
            petProfile = await PetProfile.findOneAndUpdate({ qr_token: dto.token }, profileData, { new: true });
        } else {
            // Create new
            petProfile = await PetProfile.create(profileData);
        }

        // Update QR Code to assigned
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendBaseUrl}/pet/${dto.token}`;
        
        await dynamicQRRepository.updateById(String(qr._id), {
            status: 'assigned',
            owner_id: user._id,
            manual_redirect_url: redirectUrl,
            assigned_at: qr.assigned_at || new Date(),
        });

        // Update user mobile if not set
        if (!user.mobile_number && dto.phone_primary) {
            user.mobile_number = dto.phone_primary;
            await user.save();
        }

        return petProfile!;
    }

    async getPetProfileByToken(token: string): Promise<IPetProfile | null> {
        return PetProfile.findOne({ qr_token: token });
    }
}

export const petProfileService = new PetProfileService();
