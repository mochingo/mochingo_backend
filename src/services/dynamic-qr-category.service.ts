import { dynamicQRCategoryRepository } from '../repositories/dynamic-qr-category.repository.js';
import mongoose from 'mongoose';
import type {
    CreateDynamicQRCategoryDto,
    UpdateDynamicQRCategoryDto,
    DynamicQRCategoryResponseDto
} from '../dto/dynamic-qr-category.dto.js';
import type { IDynamicQRCategory } from '../models/DynamicQRCategory.js';

const mapCategory = (category: IDynamicQRCategory, inUse?: boolean): DynamicQRCategoryResponseDto => ({
    _id: String(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description,
    in_use: inUse,
    created_at: category.created_at.toISOString(),
    updated_at: category.updated_at.toISOString(),
});

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

export interface IDynamicQRCategoryService {
    create(dto: CreateDynamicQRCategoryDto): Promise<DynamicQRCategoryResponseDto>;
    getAll(): Promise<DynamicQRCategoryResponseDto[]>;
    getById(id: string): Promise<DynamicQRCategoryResponseDto>;
    update(id: string, dto: UpdateDynamicQRCategoryDto): Promise<DynamicQRCategoryResponseDto>;
    delete(id: string): Promise<void>;
}

export class DynamicQRCategoryService implements IDynamicQRCategoryService {
    async create(dto: CreateDynamicQRCategoryDto): Promise<DynamicQRCategoryResponseDto> {
        const slug = dto.slug || generateSlug(dto.name);
        
        const existing = await dynamicQRCategoryRepository.findBySlug(slug);
        if (existing) {
            throw new Error(`Category with slug '${slug}' already exists`);
        }

        const category = await dynamicQRCategoryRepository.create({
            name: dto.name,
            slug,
            description: dto.description
        });

        return mapCategory(category);
    }

    async getAll(): Promise<DynamicQRCategoryResponseDto[]> {
        const categories = await dynamicQRCategoryRepository.findAll();
        
        // Find which categories are in use
        const inUseGroups = await mongoose.connection.collection('dynamic_qr_groups').distinct('category_id', { category_id: { $ne: null } });
        const inUseIds = new Set(inUseGroups.map(id => String(id)));

        return categories.map(cat => mapCategory(cat, inUseIds.has(String(cat._id))));
    }

    async getById(id: string): Promise<DynamicQRCategoryResponseDto> {
        const category = await dynamicQRCategoryRepository.findById(id);
        if (!category) throw new Error('Category not found');
        const count = await mongoose.connection.collection('dynamic_qr_groups').countDocuments({ category_id: new mongoose.Types.ObjectId(id) });
        return mapCategory(category, count > 0);
    }

    async update(id: string, dto: UpdateDynamicQRCategoryDto): Promise<DynamicQRCategoryResponseDto> {
        const category = await dynamicQRCategoryRepository.findById(id);
        if (!category) throw new Error('Category not found');

        let newSlug = category.slug;
        if (dto.slug || dto.name) {
            newSlug = dto.slug || generateSlug(dto.name || category.name);
            if (newSlug !== category.slug) {
                const existing = await dynamicQRCategoryRepository.findBySlug(newSlug);
                if (existing && String(existing._id) !== id) {
                    throw new Error(`Category with slug '${newSlug}' already exists`);
                }
            }
        }

        const updated = await dynamicQRCategoryRepository.updateById(id, {
            name: dto.name || category.name,
            slug: newSlug,
            description: dto.description !== undefined ? dto.description : category.description
        });

        if (!updated) throw new Error('Category not found');
        const count = await mongoose.connection.collection('dynamic_qr_groups').countDocuments({ category_id: new mongoose.Types.ObjectId(id) });
        return mapCategory(updated, count > 0);
    }

    async delete(id: string): Promise<void> {
        const count = await mongoose.connection.collection('dynamic_qr_groups').countDocuments({ category_id: new mongoose.Types.ObjectId(id) });
        if (count > 0) {
            throw new Error('Cannot delete category because it is assigned to one or more QR groups.');
        }

        const deleted = await dynamicQRCategoryRepository.deleteById(id);
        if (!deleted) throw new Error('Category not found');
    }
}

export const dynamicQRCategoryService = new DynamicQRCategoryService();
