import { Request, Response } from 'express';
import { staffService } from '../services/staff.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const createStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email) {
            sendError(res, 'Name and email are required', null, 400);
            return;
        }
        const staff = await staffService.createStaff({ name, email, password });
        sendSuccess(res, staff, 'Staff created successfully');
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const getStaffList = async (req: Request, res: Response): Promise<void> => {
    try {
        const staffList = await staffService.getStaffList();
        sendSuccess(res, staffList);
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, email, password, is_active } = req.body;
        const staff = await staffService.updateStaff(id, { name, email, password, is_active });
        sendSuccess(res, staff, 'Staff updated successfully');
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await staffService.deleteStaff(id);
        sendSuccess(res, null, 'Staff deleted successfully');
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};

export const getStaffAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const analytics = await staffService.getStaffAnalytics(id);
        sendSuccess(res, analytics);
    } catch (error: any) {
        sendError(res, error.message, null, 400);
    }
};
