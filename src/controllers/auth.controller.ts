import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { validateLoginDto } from '../dto/auth.dto.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'mochingo_token';

const cookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dto = validateLoginDto(req.body);
        const { admin, token } = await authService.login(dto);
        res.cookie(COOKIE_NAME, token, cookieOptions);
        sendSuccess(res, { admin }, 'Login successful');
    } catch (error) {
        sendError(res, (error as Error).message, null, 401);
    }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(COOKIE_NAME);
    sendSuccess(res, null, 'Logged out successfully');
};

export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).admin;
        const admin = await authService.getAdminById(user.id);
        if (!admin) {
            sendError(res, 'Admin not found', null, 404);
            return;
        }
        sendSuccess(res, { admin });
    } catch (error) {
        sendError(res, (error as Error).message);
    }
};
