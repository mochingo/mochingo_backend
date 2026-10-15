import { Request, Response, NextFunction } from 'express';
import { cardProfileService } from '../services/card-profile.service.js';
import { validateSetupCardProfileDto } from '../dto/card-profile.dto.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const setupCardProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const dto = validateSetupCardProfileDto(req.body);
        const imageBuffer = req.file?.buffer;
        const imageMimeType = req.file?.mimetype || 'image/jpeg';

        const result = await cardProfileService.setupCardProfile(userId, dto, imageBuffer, imageMimeType);
        sendSuccess(res, result, 'Digital card profile successfully saved');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const getCardProfileByToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;
        const result = await cardProfileService.getCardProfileByToken(token);

        if (!result) {
            sendError(res, 'Digital card profile not found', null, 404);
            return;
        }

        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const getMyCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const cards = await cardProfileService.getMyCards(userId);
        sendSuccess(res, { cards });
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};
