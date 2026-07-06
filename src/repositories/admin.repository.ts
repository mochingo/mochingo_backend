import Admin, { IAdmin } from '../models/Admin.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IAdminRepository {
    findByEmail(email: string): Promise<IAdmin | null>;
    findById(id: string): Promise<IAdmin | null>;
    create(data: Partial<IAdmin>): Promise<IAdmin>;
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

    async create(data: Partial<IAdmin>): Promise<IAdmin> {
        return Admin.create(data);
    }

    async existsByEmail(email: string): Promise<boolean> {
        const found = await Admin.exists({ email: email.trim().toLowerCase() });
        return !!found;
    }
}

export const adminRepository = new MongoAdminRepository();
