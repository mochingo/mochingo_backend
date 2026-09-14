import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessCategory extends Document {
    name: string;
    created_at: Date;
    updated_at: Date;
}

const BusinessCategorySchema = new Schema<IBusinessCategory>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

BusinessCategorySchema.index({ name: 1 });

const BusinessCategory = mongoose.model<IBusinessCategory>('BusinessCategory', BusinessCategorySchema, 'business_categories');

export default BusinessCategory;
