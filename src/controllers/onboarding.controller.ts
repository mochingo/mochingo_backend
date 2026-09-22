import { Request, Response } from 'express';
import { onboardingService } from '../services/onboarding.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ── Webhook ──────────────────────────────────────────────────────────────────

export const receiveOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name,
            qualification,
            dob,
            pulse_visit_id,
            registration_no,
            service_area,
            qr_link,
            photo_url,
            source_app,
        } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            sendError(res, 'name is required', null, 400);
            return;
        }

        const record = await onboardingService.createRecord({
            name,
            qualification,
            dob,
            pulse_visit_id,
            registration_no,
            service_area,
            qr_link,
            photo_url,
            source_app,
        });

        sendSuccess(res, { id: record._id, registration_no: record.registration_no }, 'Onboarding received', 201);
    } catch (error: any) {
        sendError(res, error.message, null, 500);
    }
};

// PUT /api/webhook/onboarding/update  — update existing record by pulse_visit_id
export const updateOnboarding = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pulse_visit_id, name, qualification, dob, registration_no, service_area, qr_link, photo_url } = req.body;

        if (!pulse_visit_id || typeof pulse_visit_id !== 'string' || !pulse_visit_id.trim()) {
            sendError(res, 'pulse_visit_id is required to identify the record', null, 400);
            return;
        }

        const updated = await onboardingService.updateByPulseVisitId(pulse_visit_id, {
            name, qualification, dob, registration_no, service_area, qr_link, photo_url,
        });

        if (!updated) {
            sendError(res, `No record found with pulse_visit_id: ${pulse_visit_id}`, null, 404);
            return;
        }

        sendSuccess(res, { id: updated._id, pulse_visit_id: updated.pulse_visit_id }, 'Record updated successfully');
    } catch (error: any) {
        sendError(res, error.message, null, 500);
    }
};

// ── Admin — List ──────────────────────────────────────────────────────────────

export const getOnboardings = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 100;
        const search = String(req.query.search || '');
        const status = String(req.query.status || '');

        const result = await onboardingService.listRecords({ page, limit, search, status });
        sendSuccess(res, result);
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const getNewCount = async (_req: Request, res: Response): Promise<void> => {
    try {
        const count = await onboardingService.getNewCount();
        sendSuccess(res, { count });
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const getRecordsByIds = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            sendError(res, 'ids array is required', null, 400);
            return;
        }
        const records = await onboardingService.getRecordsByIds(ids);
        sendSuccess(res, { records });
    } catch (error: any) {
        sendError(res, error.message);
    }
};

// ── Admin — Status Updates ────────────────────────────────────────────────────

export const markDownloaded = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            sendError(res, 'ids array is required', null, 400);
            return;
        }
        await onboardingService.markDownloaded(ids);
        sendSuccess(res, null, `${ids.length} record(s) marked as downloaded`);
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const markDone = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            sendError(res, 'ids array is required', null, 400);
            return;
        }
        await onboardingService.markDone(ids);
        sendSuccess(res, null, `${ids.length} record(s) marked as done`);
    } catch (error: any) {
        sendError(res, error.message);
    }
};
