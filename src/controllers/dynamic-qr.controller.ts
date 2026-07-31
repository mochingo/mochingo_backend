import { Request, Response, NextFunction } from 'express';
import { dynamicQRService } from '../services/dynamic-qr.service.js';
import {
    validateCreateDynamicQRDto,
    validateUpdateDynamicQRDto,
    validateApplyTemplateDto,
    validateScanAssignDto,
} from '../dto/dynamic-qr.dto.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ─── Admin: List Groups ───────────────────────────────────────────────────────

export const listDynamicQRs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
        const search = String(req.query.search || '').trim();
        const result = await dynamicQRService.list({ page, limit, search });
        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message);
    }
};

// ─── Admin: Create Group ──────────────────────────────────────────────────────

export const createDynamicQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dto = validateCreateDynamicQRDto(req.body);
        const adminId = (req as any).admin?.id;
        const result = await dynamicQRService.create(dto, adminId);
        sendSuccess(res, result, `Dynamic QR${result.created_count > 1 ? ' batch' : ''} created`, 201);
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

// ─── Admin: Get Single QR ────────────────────────────────────────────────────

export const getDynamicQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const qr = await dynamicQRService.getById(req.params.dynamicQrId);
        sendSuccess(res, qr);
    } catch (error) {
        sendError(res, (error as Error).message, null, 404);
    }
};

// ─── Admin: Get Batch ────────────────────────────────────────────────────────

export const getDynamicQRBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { batchId } = req.params;
        const search = String(req.query.search || '').trim();
        if (!batchId) { sendError(res, 'Batch ID is required', null, 400); return; }
        const result = await dynamicQRService.getBatch(batchId, search);
        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message, null, 404);
    }
};

// ─── Admin: Update Batch Category ────────────────────────────────────────────

export const updateDynamicQRBatchCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { batchId } = req.params;
        const { category_id } = req.body;
        if (!batchId) { sendError(res, 'Batch ID is required', null, 400); return; }
        await dynamicQRService.updateBatchCategory(batchId, category_id || null);
        sendSuccess(res, null, 'Batch category updated');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

// ─── Admin: Update Single QR ─────────────────────────────────────────────────

export const updateDynamicQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dto = validateUpdateDynamicQRDto(req.body);
        const result = await dynamicQRService.update(req.params.dynamicQrId, dto);
        sendSuccess(res, result, 'Dynamic QR updated');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

// ─── Admin: Apply Template to Batch ─────────────────────────────────────────

export const applyDynamicQRTemplateToBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { batchId } = req.params;
        if (!batchId) { sendError(res, 'Batch ID is required', null, 400); return; }
        const dto = validateApplyTemplateDto(req.body);
        const result = await dynamicQRService.applyTemplate(batchId, dto);
        sendSuccess(res, result, 'Template applied to batch');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

// ─── Admin: Scan-Assign ───────────────────────────────────────────────────────

export const scanAssignDynamicQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const dto = validateScanAssignDto(req.body);
        const { qr, alreadyAssigned } = await dynamicQRService.scanAssign(dto);
        if (alreadyAssigned) {
            res.status(409).json({
                status: false,
                message: 'This QR is already assigned.',
                data: qr,
            });
            return;
        }
        sendSuccess(res, qr, dto.replace_existing ? 'Assignment replaced' : 'QR assigned');
    } catch (error) {
        sendError(res, (error as Error).message, null, 400);
    }
};

// ─── Admin: Unassign ─────────────────────────────────────────────────────────

export const unassignDynamicQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await dynamicQRService.unassign(req.params.dynamicQrId);
        sendSuccess(res, result, 'Dynamic QR unassigned');
    } catch (error) {
        sendError(res, (error as Error).message, null, 404);
    }
};

// ─── Public: Resolve ─────────────────────────────────────────────────────────

export const resolveDynamicQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = String(req.params.token || '').trim().toLowerCase();
        if (!token) { sendError(res, 'Token is required', null, 400); return; }
        const result = await dynamicQRService.resolve(token);
        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message);
    }
};
// ─── Admin: Analytics ─────────────────────────────────────────────────────────

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const month = req.query.month ? Number(req.query.month) : undefined;
        const year = req.query.year ? Number(req.query.year) : undefined;
        
        const result = await dynamicQRService.getAnalytics(month, year);
        sendSuccess(res, result);
    } catch (error) {
        sendError(res, (error as Error).message);
    }
};
