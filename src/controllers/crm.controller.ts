import { Request, Response } from 'express';
import { crmService } from '../services/crm.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await crmService.getCategories();
        sendSuccess(res, categories);
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        if (!name) {
            sendError(res, 'Category name is required', null, 400);
            return;
        }
        const category = await crmService.createCategory(name);
        sendSuccess(res, category, 'Category created', 201);
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const getCustomerData = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const search = String(req.query.search || '');

        const result = await crmService.getCustomerData(page, limit, search);
        sendSuccess(res, result);
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const createCustomerData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, mobile_number, business_name, place, purchased_items, business_category_id } = req.body;
        const adminId = (req as any).admin?.id;

        if (!name || !mobile_number || !business_name || !place || !business_category_id) {
            sendError(res, 'Missing required fields', null, 400);
            return;
        }

        const data = await crmService.createCustomerData({
            name,
            mobile_number,
            business_name,
            place,
            purchased_items: purchased_items || [],
            business_category_id,
            entered_by: adminId,
        });

        sendSuccess(res, data, 'Customer data saved successfully', 201);
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const checkCustomerExists = async (req: Request, res: Response): Promise<void> => {
    try {
        const { number } = req.params;
        const exists = await crmService.checkCustomerExists(number);
        sendSuccess(res, { exists });
    } catch (error: any) {
        sendError(res, error.message);
    }
};
