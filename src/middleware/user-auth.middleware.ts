import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.util.js';
import { sendError } from '../utils/response.util.js';

export const userAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = req.cookies?.mochingo_consumer_token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            sendError(res, 'Authentication required', null, 401);
            return;
        }

        const decoded = verifyToken(token);
        if (decoded.role !== 'consumer') {
            sendError(res, 'Invalid user role', null, 403);
            return;
        }

        (req as any).user = decoded;
        next();
    } catch (error) {
        sendError(res, 'Invalid or expired token', null, 401);
    }
};
