import { Request, Response, NextFunction } from 'express';
import { cardProfileService } from '../services/card-profile.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const listCards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const search = String(req.query.search || '').trim();
        const status = (req.query.status as any) || 'all';

        const result = await cardProfileService.listCardsForAdmin({ page, limit, search, status });
        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const getCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await cardProfileService.getCardByIdForAdmin(id);
        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message, null, 404);
    }
};

export const updateCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await cardProfileService.updateCardByAdmin(id, req.body);
        sendSuccess(res, result, 'Digital card updated successfully');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

export const deleteCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        await cardProfileService.deleteCardByAdmin(id);
        sendSuccess(res, null, 'Digital card deleted successfully');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};
