import { Request, Response, NextFunction } from 'express';
import { consumerAuthService } from '../services/consumer-auth.service.js';
import { validateConsumerLoginDto } from '../dto/consumer-auth.dto.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { env } from '../config/env.js';

const CONSUMER_COOKIE_NAME = 'mochingo_consumer_token';

const cookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dto = validateConsumerLoginDto(req.body);
        const { user, token } = await consumerAuthService.loginWithGoogle(dto);
        res.cookie(CONSUMER_COOKIE_NAME, token, cookieOptions);
        sendSuccess(res, { user, token }, 'Login successful');
    } catch (error) {
        sendError(res, (error as Error).message, null, 401);
    }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(CONSUMER_COOKIE_NAME);
    sendSuccess(res, null, 'Logged out successfully');
};

export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        const authUser = (req as any).user;
        const user = await consumerAuthService.getUserById(authUser.id);
        if (!user) {
            sendError(res, 'User not found', null, 404);
            return;
        }
        sendSuccess(res, { user });
    } catch (error) {
        sendError(res, (error as Error).message);
    }
};
