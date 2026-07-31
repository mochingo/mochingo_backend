import mongoose from 'mongoose';
import DynamicQRModel from '../models/DynamicQR.js';
import { dynamicQRRepository } from '../repositories/dynamic-qr.repository.js';
import { dynamicQRCategoryRepository } from '../repositories/dynamic-qr-category.repository.js';
import { env } from '../config/env.js';
import { generateDynamicQRToken, normalizeUrl, normalizeIdValue } from '../utils/crypto.util.js';
import type {
    CreateDynamicQRDto,
    UpdateDynamicQRDto,
    ApplyTemplateDto,
    ScanAssignDto,
    DynamicQRResponseDto,
    BatchResponseDto,
    DynamicQRGroupInventoryItemDto,
    ListDynamicQRsResponseDto,
    ListDynamicQRsQueryDto,
    ResolveQRResponseDto,
    QueryParamTemplateDto,
} from '../dto/dynamic-qr.dto.js';
import type { IDynamicQR } from '../models/DynamicQR.js';

// ─── Public URL Helpers ───────────────────────────────────────────────────────

const getDynamicQRBaseUrl = (): string => {
    const raw = String(env.frontendUrl || 'https://www.mochingo.com').trim();
    try {
        const parsed = new URL(raw);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return 'https://www.mochingo.com';
    }
};

const buildPublicUrl = (token: string): string =>
    `${getDynamicQRBaseUrl()}/dq/${encodeURIComponent(token)}`;

const buildResolvedUrl = (qr: IDynamicQR): string => {
    const base = getDynamicQRBaseUrl();
    if (qr.status === 'assigned' && qr.manual_redirect_url) return qr.manual_redirect_url;
    return `${base}/`;
};

const buildAssignmentSummary = (qr: IDynamicQR): string => {
    if (qr.manual_redirect_url) return `Manual — ${qr.manual_redirect_url}`;
    if (qr.status === 'disabled') return 'Disabled';
    return 'Unassigned';
};

// ─── Mapper ──────────────────────────────────────────────────────────────────

const mapQR = (qr: Record<string, any>): DynamicQRResponseDto => ({
    _id: String(qr._id),
    token: qr.token,
    label: qr.label,
    group_id: qr.group_id ? String(qr.group_id) : null,
    batch_id: qr.batch_id ?? null,
    batch_label: qr.batch_label ?? null,
    batch_size: qr.batch_size ?? null,
    batch_sequence: qr.batch_sequence ?? null,
    status: qr.status,
    manual_redirect_url: qr.manual_redirect_url ?? null,
    id_value: qr.id_value ?? null,
    qr_url: buildPublicUrl(String(qr.token)),
    resolved_url: buildResolvedUrl(qr as IDynamicQR),
    assignment_summary: buildAssignmentSummary(qr as IDynamicQR),
    scan_count: qr.scan_count ?? 0,
    last_scanned_at: qr.last_scanned_at ? new Date(qr.last_scanned_at).toISOString() : null,
    created_at: new Date(qr.created_at).toISOString(),
    updated_at: new Date(qr.updated_at).toISOString(),
});

const mapGroupInventoryItem = (
    group: Record<string, any>,
    counts?: Record<string, any>
): DynamicQRGroupInventoryItemDto => {
    const qrCount = Number(counts?.qr_count || group.qr_count || 1);
    const assignedCount = Number(counts?.assigned_count || 0);
    const disabledCount = Number(counts?.disabled_count || 0);
    const unassignedCount = Number(counts?.unassigned_count || 0);

    let status: 'assigned' | 'unassigned' | 'disabled' | 'mixed';
    if (qrCount === 1) {
        status = assignedCount === 1 ? 'assigned' : disabledCount === 1 ? 'disabled' : 'unassigned';
    } else {
        status = assignedCount === qrCount ? 'assigned' : disabledCount === qrCount ? 'disabled' : 'mixed';
    }

    const assignmentSummary = qrCount === 1
        ? (assignedCount === 1 ? 'Assigned' : disabledCount === 1 ? 'Disabled' : 'Unassigned')
        : `${assignedCount}/${qrCount} assigned • ${unassignedCount} unassigned • ${disabledCount} disabled`;

    return {
        item_type: 'batch',
        batch_id: String(group._id),
        label: group.label,
        qr_count: qrCount,
        assigned_count: assignedCount,
        unassigned_count: unassignedCount,
        disabled_count: disabledCount,
        status,
        assignment_summary: assignmentSummary,
        matched_qr_id: counts?.matched_qr_id ?? null,
        matched_qr_label: counts?.matched_label ?? null,
        matched_qr_token: counts?.matched_token ?? null,
        matched_qr_sequence: counts?.matched_sequence ?? null,
        matched_manual_redirect_url: counts?.matched_manual_redirect_url ?? null,
        matched_dynamic_url: counts?.matched_dynamic_url ?? null,
        created_at: new Date(group.created_at).toISOString(),
        updated_at: new Date(group.updated_at).toISOString(),
    };
};

// ─── Number Pattern Helpers ───────────────────────────────────────────────────

interface NumberPattern { prefix: string; separator: string; number: number }

const parseNumberPattern = (value?: string | null): NumberPattern | null => {
    const raw = String(value || '').trim();
    const match = raw.match(/^(.*?)([^a-zA-Z0-9]?)(\d+)$/);
    if (!match) return null;
    return { prefix: match[1] || '', separator: match[2] || '', number: Number(match[3]) };
};

const buildUrlFromBaseAndParams = (baseUrl: string, queryParams: QueryParamTemplateDto[]): string => {
    let base = baseUrl.trim();
    if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
    const url = new URL(base);
    url.search = '';
    for (const param of queryParams) url.searchParams.set(param.key, param.value);
    return url.toString();
};

const normalizeSequenceValue = (value: unknown): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const rounded = Math.floor(parsed);
    return rounded > 0 ? rounded : null;
};

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IDynamicQRService {
    list(query: ListDynamicQRsQueryDto): Promise<ListDynamicQRsResponseDto>;
    create(dto: CreateDynamicQRDto, adminId?: string): Promise<{ batch_id: string; batch_label: string; created_count: number; dynamic_qrs: DynamicQRResponseDto[] }>;
    getById(id: string): Promise<DynamicQRResponseDto>;
    getBatch(batchId: string, search: string): Promise<BatchResponseDto>;
    updateBatchCategory(batchId: string, categoryId: string | null): Promise<void>;
    update(id: string, dto: UpdateDynamicQRDto): Promise<DynamicQRResponseDto>;
    applyTemplate(batchId: string, dto: ApplyTemplateDto): Promise<BatchResponseDto>;
    scanAssign(dto: ScanAssignDto): Promise<{ qr: DynamicQRResponseDto; alreadyAssigned: boolean }>;
    unassign(id: string): Promise<DynamicQRResponseDto>;
    resolve(token: string): Promise<ResolveQRResponseDto>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class DynamicQRService implements IDynamicQRService {

    async list(query: ListDynamicQRsQueryDto): Promise<ListDynamicQRsResponseDto> {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;
        const safeRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const labelQuery = search ? { label: { $regex: safeRegex, $options: 'i' } } : {};

        const childMatches = search
            ? await dynamicQRRepository.findGroupSearchMatches(search)
            : [];
        const matchedGroupIds = childMatches
            .map((m) => String(m._id))
            .filter((id) => mongoose.Types.ObjectId.isValid(id));
        const shouldUseChildMatches = search && matchedGroupIds.length > 0;
        const dbQuery = shouldUseChildMatches
            ? { $or: [labelQuery, { _id: { $in: matchedGroupIds.map((id) => new mongoose.Types.ObjectId(id)) } }] }
            : labelQuery;

        const [groups, total] = await Promise.all([
            dynamicQRRepository.findGroupsPaged(dbQuery, skip, limit),
            dynamicQRRepository.countGroups(dbQuery),
        ]);
        const counts = await dynamicQRRepository.getGroupStatusCounts(groups.map((g) => String((g as any)._id)));
        const countMap = new Map(counts.map((c) => [String(c._id), c]));
        const matchMap = new Map(childMatches.map((m) => [String(m._id), m]));

        return {
            dynamic_qrs: groups.map((group) => {
                const groupId = String((group as any)._id);
                return mapGroupInventoryItem(group as any, {
                    ...(countMap.get(groupId) || {}),
                    ...(matchMap.get(groupId) || {}),
                });
            }),
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    async create(dto: CreateDynamicQRDto, adminId?: string): Promise<{ batch_id: string; batch_label: string; created_count: number; dynamic_qrs: DynamicQRResponseDto[] }> {
        const group = await dynamicQRRepository.createGroup({
            label: dto.label,
            qr_count: dto.count,
            category_id: dto.category_id ? new mongoose.Types.ObjectId(dto.category_id) : undefined,
            created_by: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
        });
        const batchId = String((group as any)._id);
        const redirectUrl = dto.manual_redirect_url ? normalizeUrl(dto.manual_redirect_url) : null;
        const paramName = dto.param_name || '';
        const valuePrefix = dto.value_prefix || '';
        const valueSeparator = dto.value_separator || '%';

        const records: Record<string, unknown>[] = [];
        for (let i = 0; i < dto.count; i++) {
            let token = '';
            do {
                token = generateDynamicQRToken();
            } while (await dynamicQRRepository.findByTokenExists(token));

            const currentNum = dto.start_from + i;
            let finalRedirectUrl: string | null = null;
            if (redirectUrl) {
                if (paramName && valuePrefix && dto.count > 1) {
                    const url = new URL(redirectUrl);
                    url.searchParams.set(paramName, `${valuePrefix}${valueSeparator}${currentNum}`);
                    finalRedirectUrl = url.toString();
                } else {
                    finalRedirectUrl = redirectUrl;
                }
            }

            records.push({
                token,
                label: dto.count > 1 ? `${dto.label} ${currentNum}` : dto.label,
                group_id: (group as any)._id,
                batch_id: batchId,
                batch_label: dto.label,
                batch_size: dto.count,
                batch_sequence: i + 1,
                status: finalRedirectUrl ? 'assigned' : 'unassigned',
                manual_redirect_url: finalRedirectUrl,
                id_value: (valuePrefix && dto.count > 1 && paramName)
                    ? normalizeIdValue(`${valuePrefix}${valueSeparator}${currentNum}`)
                    : null,
                created_by: adminId || null,
                assigned_at: finalRedirectUrl ? new Date() : null,
                last_reassigned_at: finalRedirectUrl ? new Date() : null,
            });
        }

        const created = await dynamicQRRepository.createMany(records as any);
        return {
            batch_id: batchId,
            batch_label: dto.label,
            created_count: created.length,
            dynamic_qrs: created.map((r) => mapQR(r.toObject ? r.toObject() : (r as any))),
        };
    }

    async getById(id: string): Promise<DynamicQRResponseDto> {
        const qr = await dynamicQRRepository.findById(id);
        if (!qr) throw new Error('Dynamic QR not found');
        return mapQR(qr as any);
    }

    async getBatch(batchId: string, search: string): Promise<BatchResponseDto> {
        const group = await dynamicQRRepository.findGroupById(batchId);
        if (!group) throw new Error('Dynamic QR group not found');
        const records = await dynamicQRRepository.findByBatchId(batchId);
        if (!records.length) throw new Error('No QRs found in batch');

        const safeRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const filtered = search
            ? records.filter((r) => {
                const mapped = mapQR(r as any);
                return [r.label, r.token, r.manual_redirect_url, r.id_value, mapped.qr_url, mapped.resolved_url]
                    .some((v) => String(v || '').match(new RegExp(safeRegex, 'i')));
            })
            : records;

        return {
            batch_id: batchId,
            batch_label: group.label,
            category_id: (group as any).category_id ? String((group as any).category_id) : null,
            qr_count: records.length,
            filtered_count: filtered.length,
            dynamic_qrs: filtered.map((r) => mapQR(r as any)),
        };
    }

    async updateBatchCategory(batchId: string, categoryId: string | null): Promise<void> {
        const group = await dynamicQRRepository.findGroupById(batchId);
        if (!group) throw new Error('Dynamic QR group not found');

        await mongoose.connection.collection('dynamic_qr_groups').updateOne(
            { _id: new mongoose.Types.ObjectId(batchId) },
            { $set: { category_id: categoryId ? new mongoose.Types.ObjectId(categoryId) : null } }
        );
    }

    async update(id: string, dto: UpdateDynamicQRDto): Promise<DynamicQRResponseDto> {
        const existing = await dynamicQRRepository.findById(id);
        if (!existing) throw new Error('Dynamic QR not found');

        const label = dto.label !== undefined ? dto.label : existing.label;
        if (!label) throw new Error('Label is required');

        let patch: Record<string, unknown> = { label };

        if (dto.status === 'disabled') {
            patch = { ...patch, status: 'disabled' };
        } else if (dto.manual_redirect_url !== undefined) {
            const url = dto.manual_redirect_url ? normalizeUrl(dto.manual_redirect_url) : null;
            patch = {
                ...patch,
                status: url ? 'assigned' : 'unassigned',
                manual_redirect_url: url,
                id_value: dto.id_value !== undefined ? dto.id_value : (existing as any).id_value ?? null,
                assigned_at: url ? (existing.status === 'assigned' ? existing.assigned_at : new Date()) : null,
                last_reassigned_at: url ? new Date() : null,
            };
        } else if (dto.status === 'unassigned') {
            patch = {
                ...patch,
                status: 'unassigned',
                manual_redirect_url: null,
                id_value: null,
                assigned_at: null,
                last_reassigned_at: null,
            };
        }

        const updated = await dynamicQRRepository.updateById(id, patch);
        if (!updated) throw new Error('Dynamic QR not found');
        return mapQR(updated as any);
    }

    async applyTemplate(batchId: string, dto: ApplyTemplateDto): Promise<BatchResponseDto> {
        const records = await dynamicQRRepository.findByBatchId(batchId);
        if (!records.length) throw new Error('Dynamic QR batch not found');

        const sourceIndex = records.findIndex((r) => String((r as any)._id) === dto.source_dynamic_qr_id);
        if (sourceIndex === -1) throw new Error('Source dynamic QR not found in batch');
        const source = records[sourceIndex] as any;

        const rangeStart = normalizeSequenceValue(dto.range_start);
        const rangeEnd = normalizeSequenceValue(dto.range_end);
        const hasRange = rangeStart !== null || rangeEnd !== null;
        const normStart = rangeStart ?? rangeEnd ?? 1;
        const normEnd = rangeEnd ?? rangeStart ?? records.length;
        if (normStart > normEnd) throw new Error('range_start must be <= range_end');

        const targetRecords = records.filter((r, idx) => {
            const seq = Number((r as any).batch_sequence || (idx + 1));
            return !hasRange || (seq >= normStart && seq <= normEnd);
        });
        if (!targetRecords.length) throw new Error('No QRs in selected range');

        const queryParams = dto.query_params || [];
        const baseUrl = dto.base_manual_redirect_url || '';
        const templateUrl = baseUrl && queryParams.length
            ? buildUrlFromBaseAndParams(baseUrl, queryParams)
            : (dto.manual_redirect_url ? normalizeUrl(dto.manual_redirect_url) : source.manual_redirect_url);

        const templateIdValue = dto.id_value !== undefined
            ? normalizeIdValue(dto.id_value)
            : (queryParams.find((p) => p.is_dynamic)?.value || source.id_value || null);
        const sourcePattern = parseNumberPattern(templateIdValue);

        await dynamicQRRepository.updateManyByIds(
            targetRecords.map((r) => String((r as any)._id)),
            (_id, index) => {
                const record = targetRecords[index] as any;
                const sourceSeq = Number(source.batch_sequence || (sourceIndex + 1));
                const currentSeq = Number(record.batch_sequence || (index + 1));
                const nextNumber = sourcePattern
                    ? sourcePattern.number - (sourceSeq - 1) + (currentSeq - 1)
                    : undefined;

                const nextIdValue = sourcePattern && nextNumber !== undefined
                    ? normalizeIdValue(`${sourcePattern.prefix}${sourcePattern.separator}${nextNumber}`)
                    : templateIdValue;

                let nextUrl: string | null = null;
                if (templateUrl) {
                    if (nextIdValue && templateIdValue && nextIdValue !== templateIdValue) {
                        try {
                            const u = new URL(templateUrl);
                            u.searchParams.forEach((v, k) => {
                                if (v === templateIdValue) u.searchParams.set(k, nextIdValue);
                            });
                            nextUrl = u.toString();
                        } catch {
                            nextUrl = templateUrl;
                        }
                    } else {
                        nextUrl = templateUrl;
                    }
                }

                return {
                    $set: {
                        status: nextUrl ? 'assigned' : 'unassigned',
                        manual_redirect_url: nextUrl,
                        id_value: nextIdValue,
                        assigned_at: nextUrl ? (record.assigned_at || source.assigned_at || new Date()) : null,
                        last_reassigned_at: new Date(),
                    },
                };
            }
        );

        const updated = await dynamicQRRepository.findByBatchId(batchId);
        return {
            batch_id: batchId,
            batch_label: updated[0]?.batch_label || updated[0]?.label || '',
            qr_count: updated.length,
            filtered_count: updated.length,
            dynamic_qrs: updated.map((r) => mapQR(r as any)),
        };
    }

    async scanAssign(dto: ScanAssignDto): Promise<{ qr: DynamicQRResponseDto; alreadyAssigned: boolean }> {
        const url = normalizeUrl(dto.manual_redirect_url);
        if (!url) throw new Error('Valid redirect URL is required');
        const patch = {
            $set: {
                status: 'assigned',
                manual_redirect_url: url,
                id_value: dto.id_value ? normalizeIdValue(dto.id_value) : null,
                assigned_at: new Date(),
                last_reassigned_at: new Date(),
            },
        };
        const updated = dto.replace_existing
            ? await dynamicQRRepository.updateByToken(dto.token, patch)
            : await dynamicQRRepository.updateAssignableByToken(dto.token, patch);

        if (updated) return { qr: mapQR(updated as any), alreadyAssigned: false };

        const existing = await dynamicQRRepository.findByToken(dto.token);
        if (!existing) throw new Error('Dynamic QR not found');
        return { qr: mapQR(existing as any), alreadyAssigned: true };
    }

    async unassign(id: string): Promise<DynamicQRResponseDto> {
        const updated = await dynamicQRRepository.updateById(id, {
            status: 'unassigned',
            manual_redirect_url: null,
            id_value: null,
            assigned_at: null,
            last_reassigned_at: null,
        });
        if (!updated) throw new Error('Dynamic QR not found');
        return mapQR(updated as any);
    }

    async resolve(token: string): Promise<ResolveQRResponseDto> {
        const qr = await dynamicQRRepository.findByToken(token);
        if (!qr) {
            return {
                token,
                status: 'missing',
                redirect_url: `${getDynamicQRBaseUrl()}/`,
            };
        }

        let resolvedUrl = buildResolvedUrl(qr);
        let category_slug = undefined;
        let category_name = undefined;

        const frontendBaseUrl = getDynamicQRBaseUrl();
        if (qr.group_id) {
            const group = await dynamicQRRepository.findGroupById(String(qr.group_id));
            if (group && group.category_id) {
                const category = await dynamicQRCategoryRepository.findById(String(group.category_id));
                if (category) {
                    category_slug = category.slug;
                    category_name = category.name;
                    if (qr.status === 'unassigned') {
                        resolvedUrl = `${frontendBaseUrl}/${category.slug}?token=${qr.token}`;
                    }
                }
            }
        }
        
        if (qr.status === 'unassigned' && !category_slug) {
            resolvedUrl = `${frontendBaseUrl}/setup?token=${qr.token}`;
        }

        return {
            token,
            status: qr.status,
            redirect_url: resolvedUrl,
            qr: mapQR(qr as any),
            category_slug,
            category_name,
        };
    }
    async getAnalytics(month?: number, year?: number): Promise<any> {
        // Aggregate totals
        const total_assigned = await DynamicQRModel.countDocuments({ status: 'assigned' });
        
        let matchStage: any = {
            status: 'assigned',
            assigned_at: { $exists: true, $ne: null }
        };

        if (month !== undefined && year !== undefined) {
            // month is 1-indexed (1 = Jan, 12 = Dec)
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            matchStage.assigned_at = { $gte: startDate, $lt: endDate };
        } else {
            // Default to last 30 days if no month/year is provided
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            matchStage.assigned_at = { $gte: thirtyDaysAgo };
        }
        
        const daily_assignments = await DynamicQRModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$assigned_at" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", count: 1 } }
        ]);

        return {
            total_assigned,
            daily_assignments
        };
    }
}

export const dynamicQRService = new DynamicQRService();
