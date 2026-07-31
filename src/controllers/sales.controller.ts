import { Request, Response } from 'express';
import { salesService } from '../services/sales.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const assignQR = async (req: Request, res: Response): Promise<void> => {
    try {
        const { qr_token, mobile_number, name, place, business, destination_url, isReassign } = req.body;
        const staffId = (req as any).admin?.id;
        
        if (!qr_token || !mobile_number || !name || !place || !destination_url) {
            sendError(res, 'Missing required fields', null, 400);
            return;
        }

        if (!staffId) {
            sendError(res, 'Unauthorized staff member', null, 401);
            return;
        }

        await salesService.assignQR({
            qr_token,
            mobile_number,
            name,
            place,
            business,
            destination_url,
            staffId,
            isReassign: !!isReassign,
        });

        sendSuccess(res, null, 'QR Code assigned successfully');
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const staffId = (req as any).admin?.id;
        if (!staffId) {
            sendError(res, 'Unauthorized staff member', null, 401);
            return;
        }
        
        const history = await salesService.getHistory(staffId);
        sendSuccess(res, {
            count: history.length,
            history
        });
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};
