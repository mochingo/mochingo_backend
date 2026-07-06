import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { TokenPayloadDto } from '../dto/auth.dto.js';

export const signToken = (payload: TokenPayloadDto): string => {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
};

export const verifyToken = (token: string): TokenPayloadDto => {
    return jwt.verify(token, env.jwtSecret) as TokenPayloadDto;
};
