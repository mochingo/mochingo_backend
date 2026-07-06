import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'] as const;

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

export const env = {
    port: Number(process.env.PORT) || 5010,
    mongoUri: process.env.MONGODB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    nodeEnv: process.env.NODE_ENV || 'development',
} as const;
