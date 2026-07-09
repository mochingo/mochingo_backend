import DynamicQRCategory, { IDynamicQRCategory } from '../models/DynamicQRCategory.js';

export interface IDynamicQRCategoryRepository {
    create(data: Partial<IDynamicQRCategory>): Promise<IDynamicQRCategory>;
    findAll(): Promise<IDynamicQRCategory[]>;
    findById(id: string): Promise<IDynamicQRCategory | null>;
    findBySlug(slug: string): Promise<IDynamicQRCategory | null>;
    updateById(id: string, data: Partial<IDynamicQRCategory>): Promise<IDynamicQRCategory | null>;
    deleteById(id: string): Promise<boolean>;
}

export class DynamicQRCategoryRepository implements IDynamicQRCategoryRepository {
    async create(data: Partial<IDynamicQRCategory>): Promise<IDynamicQRCategory> {
        const category = new DynamicQRCategory(data);
        return category.save();
    }

    async findAll(): Promise<IDynamicQRCategory[]> {
        return DynamicQRCategory.find().sort({ created_at: -1 });
    }

    async findById(id: string): Promise<IDynamicQRCategory | null> {
        return DynamicQRCategory.findById(id);
    }

    async findBySlug(slug: string): Promise<IDynamicQRCategory | null> {
        return DynamicQRCategory.findOne({ slug });
    }

    async updateById(id: string, data: Partial<IDynamicQRCategory>): Promise<IDynamicQRCategory | null> {
        return DynamicQRCategory.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await DynamicQRCategory.findByIdAndDelete(id);
        return !!result;
    }
}

export const dynamicQRCategoryRepository = new DynamicQRCategoryRepository();
