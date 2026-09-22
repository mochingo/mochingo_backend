import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util.js';

export const webhookApiKey = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string | undefined;
    const expectedKey = process.env.WEBHOOK_API_KEY;

    if (!expectedKey) {
        // Fail safe — if no key is configured, block all requests
        sendError(res, 'Webhook not configured', null, 503);
        return;
    }

    if (!apiKey || apiKey !== expectedKey) {
        sendError(res, 'Invalid or missing API key', null, 401);
        return;
    }

    next();
};
