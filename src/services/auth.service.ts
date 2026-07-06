import bcrypt from 'bcryptjs';
import { adminRepository } from '../repositories/admin.repository.js';
import { signToken } from '../utils/token.util.js';
import type { LoginDto, AdminResponseDto, TokenPayloadDto } from '../dto/auth.dto.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IAuthService {
    login(dto: LoginDto): Promise<{ admin: AdminResponseDto; token: string }>;
    getAdminById(id: string): Promise<AdminResponseDto | null>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class AuthService implements IAuthService {

    async login(dto: LoginDto): Promise<{ admin: AdminResponseDto; token: string }> {
        const admin = await adminRepository.findByEmail(dto.email);
        if (!admin) throw new Error('Invalid credentials');
        if (!admin.is_active) throw new Error('Account is deactivated');

        const isMatch = await bcrypt.compare(dto.password, admin.password_hash);
        if (!isMatch) throw new Error('Invalid credentials');

        const payload: TokenPayloadDto = {
            id: String((admin as any)._id),
            email: admin.email,
            role: admin.role,
        };

        const token = signToken(payload);

        const adminDto: AdminResponseDto = {
            id: String((admin as any)._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
            is_active: admin.is_active,
        };

        return { admin: adminDto, token };
    }

    async getAdminById(id: string): Promise<AdminResponseDto | null> {
        const admin = await adminRepository.findById(id);
        if (!admin) return null;
        return {
            id: String((admin as any)._id),
            name: admin.name,
            email: admin.email,
            role: admin.role,
            is_active: admin.is_active,
        };
    }
}

export const authService = new AuthService();
