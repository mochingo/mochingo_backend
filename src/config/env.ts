import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'] as const;

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

/**
 * Sanitize FRONTEND_URL from .env.
 * Guards against common misconfiguration patterns:
 *   - "FRONTEND_URL=https://..." (key=value accidentally included as value)
 *   - "https:/www..."  (single-slash typo)
 *   - trailing slashes
 */
const sanitizeFrontendUrl = (raw: string | undefined): string => {
    const fallback = 'https://www.mochingo.com';
    if (!raw) return fallback;
    // Remove accidental "FRONTEND_URL=" prefix (copy-paste bug from .env)
    let clean = raw.trim().replace(/^FRONTEND_URL=/i, '').trim();
    // Fix single-slash protocol (https:/www → https://www)
    clean = clean.replace(/^(https?:)\/([^/])/, '$1//$2');
    // Validate it's a real URL
    try {
        const parsed = new URL(clean);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return fallback;
    }
};

export const env = {
    port: Number(process.env.PORT) || 5010,
    mongoUri: process.env.MONGODB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    frontendUrl: sanitizeFrontendUrl(process.env.FRONTEND_URL),
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || 'https://www.mochingo.com')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    nodeEnv: process.env.NODE_ENV || 'development',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
} as const;

