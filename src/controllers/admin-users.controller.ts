import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DynamicQR from '../models/DynamicQR.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { env } from '../config/env.js';

const getFrontendBase = (): string => {
    const raw = String(env.frontendUrl || 'https://www.mochingo.com').trim();
    try {
        const p = new URL(raw);
        return `${p.protocol}//${p.host}`;
    } catch {
        return 'https://www.mochingo.com';
    }
};

// ─── List Users (with QR counts) ─────────────────────────────────────────────

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
        const search = String(req.query.search || '').trim();
        const skip = (page - 1) * limit;

        const query: Record<string, any> = {};
        if (search) {
            const safeRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: safeRegex, $options: 'i' } },
                { email: { $regex: safeRegex, $options: 'i' } },
                { mobile_number: { $regex: safeRegex, $options: 'i' } },
                { place: { $regex: safeRegex, $options: 'i' } },
                { business: { $regex: safeRegex, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('name email mobile_number place business profile_picture created_at updated_at')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        if (!users.length) {
            return sendSuccess(res, { users: [], total, page, limit, total_pages: Math.ceil(total / limit) });
        }

        // Get QR counts per user in one aggregation
        const userIds = users.map(u => new mongoose.Types.ObjectId(String(u._id)));
        const qrCounts: { _id: mongoose.Types.ObjectId; qr_count: number; scan_total: number }[] = await DynamicQR.aggregate([
            { $match: { owner_id: { $in: userIds } } },
            {
                $group: {
                    _id: '$owner_id',
                    qr_count: { $sum: 1 },
                    scan_total: { $sum: '$scan_count' },
                },
            },
        ]);
        const countMap = new Map(qrCounts.map(c => [String(c._id), c]));

        const mapped = users.map((u) => {
            const counts = countMap.get(String(u._id));
            return {
                id: String(u._id),
                name: u.name,
                email: u.email,
                mobile_number: u.mobile_number || null,
                place: u.place || null,
                business: u.business || null,
                profile_picture: u.profile_picture || null,
                qr_count: counts?.qr_count ?? 0,
                scan_total: counts?.scan_total ?? 0,
                created_at: new Date(u.created_at).toISOString(),
                updated_at: new Date(u.updated_at).toISOString(),
            };
        });

        sendSuccess(res, {
            users: mapped,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        });
    } catch (error) {
        sendError(res, (error as Error).message, null, 500);
    }
};

// ─── Get Single User + Their QRs ─────────────────────────────────────────────

export const getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return sendError(res, 'Invalid user ID', null, 400);
        }

        const user = await User.findById(userId)
            .select('name email mobile_number place business profile_picture created_at updated_at')
            .lean();

        if (!user) {
            return sendError(res, 'User not found', null, 404);
        }

        const base = getFrontendBase();
        const qrs = await DynamicQR.find({ owner_id: new mongoose.Types.ObjectId(userId) })
            .select('token label status manual_redirect_url scan_count last_scanned_at assigned_at created_at batch_label')
            .sort({ assigned_at: -1 })
            .lean();

        const mappedQRs = qrs.map(q => ({
            id: String(q._id),
            token: q.token,
            label: q.label,
            batch_label: q.batch_label || null,
            status: q.status,
            manual_redirect_url: q.manual_redirect_url || null,
            qr_url: `${base}/dq/${encodeURIComponent(q.token)}`,
            scan_count: q.scan_count ?? 0,
            last_scanned_at: q.last_scanned_at ? new Date(q.last_scanned_at).toISOString() : null,
            assigned_at: q.assigned_at ? new Date(q.assigned_at).toISOString() : null,
        }));

        sendSuccess(res, {
            user: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                mobile_number: user.mobile_number || null,
                place: user.place || null,
                business: user.business || null,
                profile_picture: user.profile_picture || null,
                created_at: new Date(user.created_at).toISOString(),
                updated_at: new Date(user.updated_at).toISOString(),
            },
            qrs: mappedQRs,
            qr_count: mappedQRs.length,
            scan_total: mappedQRs.reduce((s, q) => s + q.scan_count, 0),
        });
    } catch (error) {
        sendError(res, (error as Error).message, null, 500);
    }
};
