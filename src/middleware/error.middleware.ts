import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util.js';

export const errorMiddleware = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('❌ Unhandled error:', err);
    sendError(res, err.message || 'Internal server error', null, 500);
};
