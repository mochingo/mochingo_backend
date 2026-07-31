import Admin, { IAdmin } from '../models/Admin.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IAdminRepository {
    findByEmail(email: string): Promise<IAdmin | null>;
    findById(id: string): Promise<IAdmin | null>;
    find(filter: Partial<IAdmin>): Promise<IAdmin[]>;
    create(data: Partial<IAdmin>): Promise<IAdmin>;
    updateById(id: string, data: Partial<IAdmin>): Promise<IAdmin | null>;
    deleteById(id: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class MongoAdminRepository implements IAdminRepository {
    async findByEmail(email: string): Promise<IAdmin | null> {
        return Admin.findOne({ email: email.trim().toLowerCase() }).lean() as Promise<IAdmin | null>;
    }

    async findById(id: string): Promise<IAdmin | null> {
        return Admin.findById(id).lean() as Promise<IAdmin | null>;
    }

    async find(filter: Partial<IAdmin>): Promise<IAdmin[]> {
        return Admin.find(filter as any).lean() as unknown as Promise<IAdmin[]>;
    }

    async create(data: Partial<IAdmin>): Promise<IAdmin> {
        return Admin.create(data);
    }

    async updateById(id: string, data: Partial<IAdmin>): Promise<IAdmin | null> {
        return Admin.findByIdAndUpdate(id, data, { new: true }).lean() as Promise<IAdmin | null>;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await Admin.findByIdAndDelete(id);
        return !!result;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const found = await Admin.exists({ email: email.trim().toLowerCase() });
        return !!found;
    }
}

export const adminRepository = new MongoAdminRepository();
