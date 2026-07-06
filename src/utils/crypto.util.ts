import crypto from 'crypto';

export const generateDynamicQRToken = (): string =>
    `dq_${crypto.randomBytes(5).toString('hex')}`;

export const normalizeIdValue = (value?: string | null): string | null => {
    if (!value) return null;
    const trimmed = String(value).trim().toLowerCase();
    return trimmed || null;
};

export const normalizeUrl = (value?: string | null): string | null => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        return new URL(withProtocol).toString();
    } catch {
        throw new Error('Invalid redirect URL');
    }
};
