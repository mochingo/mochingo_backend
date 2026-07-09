import { Request, Response } from 'express';
import { dynamicQRCategoryService } from '../services/dynamic-qr-category.service.js';

export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, slug, description } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        const category = await dynamicQRCategoryService.create({ name, slug, description });
        res.status(201).json(category);
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await dynamicQRCategoryService.getAll();
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const category = await dynamicQRCategoryService.getById(id);
        res.json(category);
    } catch (error: any) {
        if (error.message === 'Category not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, slug, description } = req.body;
        const category = await dynamicQRCategoryService.update(id, { name, slug, description });
        res.json(category);
    } catch (error: any) {
        if (error.message === 'Category not found') {
            res.status(404).json({ error: error.message });
        } else if (error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await dynamicQRCategoryService.delete(id);
        res.status(204).send();
    } catch (error: any) {
        if (error.message === 'Category not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
};
