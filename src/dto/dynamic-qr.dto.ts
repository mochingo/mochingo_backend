// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface QueryParamTemplateDto {
    key: string;
    value: string;
    is_dynamic?: boolean;
}

export interface CreateDynamicQRDto {
    label: string;
    count: number;
    start_from: number;
    manual_redirect_url?: string | null;
    /** Optional param name appended to URL for bulk numbered QRs */
    param_name?: string;
    value_prefix?: string;
    value_separator?: string;
}

export interface UpdateDynamicQRDto {
    label?: string;
    status?: 'assigned' | 'unassigned' | 'disabled';
    manual_redirect_url?: string | null;
    id_value?: string | null;
}

export interface ApplyTemplateDto {
    source_dynamic_qr_id: string;
    manual_redirect_url?: string | null;
    base_manual_redirect_url?: string;
    query_params?: QueryParamTemplateDto[];
    id_value?: string | null;
    range_start?: number | null;
    range_end?: number | null;
}

export interface ScanAssignDto {
    token: string;
    manual_redirect_url: string;
    id_value?: string | null;
    replace_existing?: boolean;
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

export interface DynamicQRResponseDto {
    _id: string;
    token: string;
    label: string;
    group_id: string | null;
    batch_id: string | null;
    batch_label: string | null;
    batch_size: number | null;
    batch_sequence: number | null;
    status: 'assigned' | 'unassigned' | 'disabled';
    manual_redirect_url: string | null;
    id_value: string | null;
    qr_url: string;            // permanent printed URL
    resolved_url: string;      // current redirect target
    assignment_summary: string;
    scan_count: number;
    last_scanned_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface DynamicQRGroupInventoryItemDto {
    item_type: 'batch';
    batch_id: string;
    label: string;
    qr_count: number;
    assigned_count: number;
    unassigned_count: number;
    disabled_count: number;
    status: 'assigned' | 'unassigned' | 'disabled' | 'mixed';
    assignment_summary: string;
    // search-matched child info
    matched_qr_id: string | null;
    matched_qr_label: string | null;
    matched_qr_token: string | null;
    matched_qr_sequence: number | null;
    matched_manual_redirect_url: string | null;
    matched_dynamic_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface BatchResponseDto {
    batch_id: string;
    batch_label: string;
    qr_count: number;
    filtered_count: number;
    dynamic_qrs: DynamicQRResponseDto[];
}

export interface ListDynamicQRsResponseDto {
    dynamic_qrs: DynamicQRGroupInventoryItemDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ResolveQRResponseDto {
    token: string;
    status: 'assigned' | 'unassigned' | 'disabled' | 'missing';
    redirect_url: string;
}

// ─── Query DTOs ──────────────────────────────────────────────────────────────

export interface ListDynamicQRsQueryDto {
    page: number;
    limit: number;
    search: string;
}

export interface BatchQueryDto {
    search: string;
}

// ─── Validators ──────────────────────────────────────────────────────────────

export const validateCreateDynamicQRDto = (body: unknown): CreateDynamicQRDto => {
    const b = body as Record<string, unknown>;
    const label = String(b?.label || '').trim() || 'Dynamic QR';
    const count = Math.max(1, Math.min(1000, Number(b?.count) || 1));
    const start_from = Math.max(1, Number(b?.start_from) || 1);
    return {
        label,
        count,
        start_from,
        manual_redirect_url: (b?.manual_redirect_url as string | null) ?? null,
        param_name: String(b?.param_name || '').trim() || undefined,
        value_prefix: String(b?.value_prefix || '').trim() || undefined,
        value_separator: String(b?.value_separator || '').trim() || '%',
    };
};

export const validateUpdateDynamicQRDto = (body: unknown): UpdateDynamicQRDto => {
    const b = body as Record<string, unknown>;
    const dto: UpdateDynamicQRDto = {};
    if (b?.label !== undefined) dto.label = String(b.label).trim();
    if (b?.status !== undefined) {
        const s = String(b.status);
        if (!['assigned', 'unassigned', 'disabled'].includes(s)) {
            throw new Error('Invalid status value');
        }
        dto.status = s as 'assigned' | 'unassigned' | 'disabled';
    }
    if (b?.manual_redirect_url !== undefined) {
        dto.manual_redirect_url = b.manual_redirect_url ? String(b.manual_redirect_url).trim() : null;
    }
    if (b?.id_value !== undefined) {
        dto.id_value = b.id_value ? String(b.id_value).trim().toLowerCase() : null;
    }
    return dto;
};

export const validateApplyTemplateDto = (body: unknown): ApplyTemplateDto => {
    const b = body as Record<string, unknown>;
    const source_dynamic_qr_id = String(b?.source_dynamic_qr_id || '').trim();
    if (!source_dynamic_qr_id) throw new Error('source_dynamic_qr_id is required');
    return {
        source_dynamic_qr_id,
        manual_redirect_url: (b?.manual_redirect_url as string | null) ?? null,
        base_manual_redirect_url: String(b?.base_manual_redirect_url || '').trim() || undefined,
        query_params: Array.isArray(b?.query_params)
            ? (b.query_params as QueryParamTemplateDto[]).map((p) => ({
                key: String(p.key || '').trim(),
                value: String(p.value || '').trim(),
                is_dynamic: Boolean(p.is_dynamic),
            })).filter((p) => p.key && p.value)
            : [],
        id_value: (b?.id_value as string | null) ?? null,
        range_start: b?.range_start != null ? Number(b.range_start) : null,
        range_end: b?.range_end != null ? Number(b.range_end) : null,
    };
};

export const validateScanAssignDto = (body: unknown): ScanAssignDto => {
    const b = body as Record<string, unknown>;
    const token = String(b?.token || '').trim().toLowerCase();
    const manual_redirect_url = String(b?.manual_redirect_url || '').trim();
    if (!token) throw new Error('token is required');
    if (!manual_redirect_url) throw new Error('manual_redirect_url is required');
    return {
        token,
        manual_redirect_url,
        id_value: (b?.id_value as string | null) ?? null,
        replace_existing: Boolean(b?.replace_existing),
    };
};
