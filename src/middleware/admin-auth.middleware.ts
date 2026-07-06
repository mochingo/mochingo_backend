import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.util.js';
import { sendError } from '../utils/response.util.js';

const COOKIE_NAME = 'mochingo_token';

export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.[COOKIE_NAME] as string | undefined;
        if (!token) {
            sendError(res, 'Authentication required', null, 401);
            return;
        }
        const payload = verifyToken(token);
        (req as any).admin = payload;
        next();
    } catch {
        sendError(res, 'Invalid or expired session', null, 401);
    }
};
