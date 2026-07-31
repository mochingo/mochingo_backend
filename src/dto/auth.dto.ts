// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface LoginDto {
    email: string;
    password: string;
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface AdminResponseDto {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'sales_staff';
    is_active: boolean;
}

export interface TokenPayloadDto {
    id: string;
    email: string;
    role: string;
}

// ─── Validators ──────────────────────────────────────────────────────────────

export const validateLoginDto = (body: unknown): LoginDto => {
    const b = body as Record<string, unknown>;
    const email = String(b?.email || '').trim().toLowerCase();
    const password = String(b?.password || '').trim();
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');
    return { email, password };
};
