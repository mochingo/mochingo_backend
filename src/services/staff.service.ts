import bcrypt from 'bcryptjs';
import { adminRepository } from '../repositories/admin.repository.js';
import { IAdmin } from '../models/Admin.js';

export interface StaffResponseDto {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: Date;
}

export class StaffService {
    async createStaff(data: { name: string; email: string; password?: string }): Promise<StaffResponseDto> {
        const exists = await adminRepository.existsByEmail(data.email);
        if (exists) {
            throw new Error('Email already exists');
        }

        const password = data.password || 'password123';
        const password_hash = await bcrypt.hash(password, 10);

        const staff = await adminRepository.create({
            name: data.name,
            email: data.email,
            password_hash,
            role: 'sales_staff',
            is_active: true,
        });

        return this.mapToDto(staff);
    }

    async getStaffList(): Promise<StaffResponseDto[]> {
        const staffList = await adminRepository.find({ role: 'sales_staff' });
        return staffList.map(this.mapToDto);
    }

    async updateStaff(id: string, data: { name?: string; email?: string; password?: string; is_active?: boolean }): Promise<StaffResponseDto> {
        const updateData: Partial<IAdmin> = {};
        
        if (data.name) updateData.name = data.name;
        if (data.email) {
            const existing = await adminRepository.findByEmail(data.email);
            if (existing && String((existing as any)._id) !== id) {
                throw new Error('Email already in use');
            }
            updateData.email = data.email;
        }
        if (data.password) {
            updateData.password_hash = await bcrypt.hash(data.password, 10);
        }
        if (data.is_active !== undefined) {
            updateData.is_active = data.is_active;
        }

        const updated = await adminRepository.updateById(id, updateData);
        if (!updated) throw new Error('Staff not found');
        return this.mapToDto(updated);
    }

    async deleteStaff(id: string): Promise<void> {
        const deleted = await adminRepository.deleteById(id);
        if (!deleted) throw new Error('Staff not found');
    }

    private mapToDto(staff: IAdmin): StaffResponseDto {
        return {
            id: String((staff as any)._id),
            name: staff.name,
            email: staff.email,
            role: staff.role,
            is_active: staff.is_active,
            created_at: staff.created_at,
        };
    }
}

export const staffService = new StaffService();
