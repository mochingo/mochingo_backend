import { Request, Response, NextFunction } from 'express';
import { petProfileService } from '../services/pet-profile.service.js';
import { validateSetupPetProfileDto } from '../dto/pet-profile.dto.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const setupPetProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        
        // Form data fields will be in req.body
        const dto = validateSetupPetProfileDto(req.body);
        
        // Image file will be in req.file (if using multer)
        const imageBuffer = req.file?.buffer;

        const profile = await petProfileService.setupPetProfile(userId, dto, imageBuffer);
        sendSuccess(res, { profile }, 'Pet Profile successfully setup');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const getPetProfileByToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;
        const profile = await petProfileService.getPetProfileByToken(token);
        
        if (!profile) {
            sendError(res, 'Pet profile not found', null, 404);
            return;
        }

        sendSuccess(res, { profile });
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};
