import mongoose, { Schema, Document } from 'mongoose';

export interface IDynamicQRCategory extends Document {
    name: string;
    slug: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

const DynamicQRCategorySchema = new Schema<IDynamicQRCategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

const DynamicQRCategory = mongoose.model<IDynamicQRCategory>(
    'DynamicQRCategory',
    DynamicQRCategorySchema,
    'dynamic_qr_categories'
);

export default DynamicQRCategory;
