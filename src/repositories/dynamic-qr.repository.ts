import mongoose from 'mongoose';
import DynamicQR, { IDynamicQR } from '../models/DynamicQR.js';
import DynamicQRGroup, { IDynamicQRGroup } from '../models/DynamicQRGroup.js';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface GroupSearchMatch {
    _id: mongoose.Types.ObjectId;
    matched_qr_id: string;
    matched_label: string;
    matched_token: string;
    matched_sequence: number | null;
    matched_manual_redirect_url: string | null;
    matched_dynamic_url: string | null;
}

export interface GroupStatusCount {
    _id: mongoose.Types.ObjectId;
    qr_count: number;
    assigned_count: number;
    unassigned_count: number;
    disabled_count: number;
}

export interface IDynamicQRRepository {
    // Groups
    createGroup(data: Partial<IDynamicQRGroup>): Promise<IDynamicQRGroup>;
    findGroupById(groupId: string): Promise<IDynamicQRGroup | null>;
    findGroupsPaged(query: Record<string, unknown>, skip: number, limit: number): Promise<IDynamicQRGroup[]>;
    countGroups(query: Record<string, unknown>): Promise<number>;
    getGroupStatusCounts(groupIds: string[]): Promise<GroupStatusCount[]>;
    findGroupSearchMatches(searchValue: string): Promise<GroupSearchMatch[]>;
    // QRs
    createMany(data: Partial<IDynamicQR>[]): Promise<IDynamicQR[]>;
    findById(id: string): Promise<IDynamicQR | null>;
    findByToken(token: string): Promise<IDynamicQR | null>;
    findByBatchId(batchId: string): Promise<IDynamicQR[]>;
    findByTokenExists(token: string): Promise<boolean>;
    updateById(id: string, update: Record<string, unknown>): Promise<IDynamicQR | null>;
    updateByToken(token: string, update: Record<string, unknown>): Promise<IDynamicQR | null>;
    updateAssignableByToken(token: string, update: Record<string, unknown>): Promise<IDynamicQR | null>;
    updateManyByIds(
        ids: string[],
        updateFactory: (id: string, index: number) => Record<string, unknown>
    ): Promise<{ modifiedCount: number }>;
    incrementScanByToken(token: string): Promise<void>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class MongoDynamicQRRepository implements IDynamicQRRepository {

    // ── Groups ──

    async createGroup(data: Partial<IDynamicQRGroup>): Promise<IDynamicQRGroup> {
        return DynamicQRGroup.create(data);
    }

    async findGroupById(groupId: string): Promise<IDynamicQRGroup | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return DynamicQRGroup.findById(groupId).lean() as unknown as Promise<IDynamicQRGroup | null>;
    }

    async findGroupsPaged(
        query: Record<string, unknown>,
        skip: number,
        limit: number
    ): Promise<IDynamicQRGroup[]> {
        return DynamicQRGroup.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean() as unknown as Promise<IDynamicQRGroup[]>;
    }

    async countGroups(query: Record<string, unknown>): Promise<number> {
        return DynamicQRGroup.countDocuments(query);
    }

    async getGroupStatusCounts(groupIds: string[]): Promise<GroupStatusCount[]> {
        const objectIds = groupIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));
        if (!objectIds.length) return [];

        return DynamicQR.aggregate([
            { $match: { group_id: { $in: objectIds } } },
            {
                $group: {
                    _id: '$group_id',
                    qr_count: { $sum: 1 },
                    assigned_count: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
                    unassigned_count: { $sum: { $cond: [{ $eq: ['$status', 'unassigned'] }, 1, 0] } },
                    disabled_count: { $sum: { $cond: [{ $eq: ['$status', 'disabled'] }, 1, 0] } },
                },
            },
        ]) as Promise<GroupStatusCount[]>;
    }

    async findGroupSearchMatches(searchValue: string): Promise<GroupSearchMatch[]> {
        const trimmed = String(searchValue || '').trim();
        if (!trimmed) return [];
        const safeRegex = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(safeRegex, 'i');

        return DynamicQR.aggregate([
            {
                $addFields: {
                    dynamic_public_url: {
                        $concat: [
                            process.env.FRONTEND_URL || 'https://www.mochingo.com',
                            '/dq/',
                            '$token',
                        ],
                    },
                },
            },
            {
                $match: {
                    $or: [
                        { label: { $regex: regex } },
                        { batch_label: { $regex: regex } },
                        { token: { $regex: regex } },
                        { manual_redirect_url: { $regex: regex } },
                        { id_value: { $regex: regex } },
                        { dynamic_public_url: { $regex: regex } },
                    ],
                },
            },
            { $sort: { batch_sequence: 1, created_at: 1 } },
            {
                $group: {
                    _id: '$group_id',
                    matched_qr_id: { $first: { $toString: '$_id' } },
                    matched_label: { $first: '$label' },
                    matched_token: { $first: '$token' },
                    matched_sequence: { $first: '$batch_sequence' },
                    matched_manual_redirect_url: { $first: '$manual_redirect_url' },
                    matched_dynamic_url: { $first: '$dynamic_public_url' },
                },
            },
            { $match: { _id: { $ne: null } } },
        ]) as Promise<GroupSearchMatch[]>;
    }

    // ── QRs ──

    async createMany(data: Partial<IDynamicQR>[]): Promise<IDynamicQR[]> {
        return DynamicQR.insertMany(data) as unknown as Promise<IDynamicQR[]>;
    }

    async findById(id: string): Promise<IDynamicQR | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return DynamicQR.findById(id).lean() as unknown as Promise<IDynamicQR | null>;
    }

    async findByToken(token: string): Promise<IDynamicQR | null> {
        return DynamicQR.findOne({ token: token.trim().toLowerCase() }).lean() as unknown as Promise<IDynamicQR | null>;
    }

    async findByBatchId(batchId: string): Promise<IDynamicQR[]> {
        const query = mongoose.Types.ObjectId.isValid(batchId)
            ? { $or: [{ group_id: new mongoose.Types.ObjectId(batchId) }, { batch_id: batchId }] }
            : { batch_id: batchId };
        return DynamicQR.find(query).sort({ batch_sequence: 1, created_at: 1 }).lean() as unknown as Promise<IDynamicQR[]>;
    }

    async findByTokenExists(token: string): Promise<boolean> {
        const found = await DynamicQR.exists({ token: token.trim().toLowerCase() });
        return !!found;
    }

    async updateById(id: string, update: Record<string, unknown>): Promise<IDynamicQR | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return DynamicQR.findByIdAndUpdate(id, update, { new: true }).lean() as unknown as Promise<IDynamicQR | null>;
    }

    async updateByToken(token: string, update: Record<string, unknown>): Promise<IDynamicQR | null> {
        return DynamicQR.findOneAndUpdate(
            { token: token.trim().toLowerCase() },
            update,
            { new: true }
        ).lean() as unknown as Promise<IDynamicQR | null>;
    }

    async updateAssignableByToken(token: string, update: Record<string, unknown>): Promise<IDynamicQR | null> {
        return DynamicQR.findOneAndUpdate(
            {
                token: token.trim().toLowerCase(),
                $or: [
                    { status: { $ne: 'assigned' } },
                    {
                        $and: [
                            { manual_redirect_url: { $in: [null, ''] } },
                        ],
                    },
                ],
            },
            update,
            { new: true }
        ).lean() as unknown as Promise<IDynamicQR | null>;
    }

    async updateManyByIds(
        ids: string[],
        updateFactory: (id: string, index: number) => Record<string, unknown>
    ): Promise<{ modifiedCount: number }> {
        if (!ids.length) return { modifiedCount: 0 };
        const operations = ids
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id, index) => ({
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(id) },
                    update: updateFactory(id, index),
                },
            }));
        if (!operations.length) return { modifiedCount: 0 };
        return DynamicQR.bulkWrite(operations) as unknown as { modifiedCount: number };
    }

    async incrementScanByToken(token: string): Promise<void> {
        await DynamicQR.updateOne(
            { token: token.trim().toLowerCase() },
            {
                $inc: { scan_count: 1 },
                $set: { last_scanned_at: new Date() },
            }
        );
    }
}

export const dynamicQRRepository = new MongoDynamicQRRepository();
