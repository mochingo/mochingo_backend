import { Request, Response, NextFunction } from 'express';
import { consumerQRService } from '../services/consumer-qr.service.js';
import { validateClaimQRDto } from '../dto/consumer-qr.dto.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const claimQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const dto = validateClaimQRDto(req.body);
        await consumerQRService.claimQR(userId, dto);
        sendSuccess(res, null, 'QR successfully claimed and assigned');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const getMyQRs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const searchQuery = req.query.q as string | undefined;
        const qrs = await consumerQRService.getMyQRs(userId, searchQuery);
        sendSuccess(res, { qrs });
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const updateMyQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const qrId = req.params.id;
        const { destination_url, qr_type, multi_links } = req.body;
        
        if (qr_type === 'multi_link') {
            if (!Array.isArray(multi_links) || multi_links.length === 0) {
                throw new Error('multi_links array is required for multi_link qr_type');
            }
        } else {
            if (!destination_url || typeof destination_url !== 'string') {
                throw new Error('Destination URL is required');
            }
        }

        await consumerQRService.updateMyQR(userId, qrId, req.body);
        sendSuccess(res, null, 'QR successfully updated');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};
