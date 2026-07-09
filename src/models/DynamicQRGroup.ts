import mongoose, { Schema, Document } from 'mongoose';

export interface IDynamicQRGroup extends Document {
    label: string;
    qr_count: number;
    category_id?: mongoose.Types.ObjectId | null;
    created_by?: mongoose.Types.ObjectId | null;
    created_at: Date;
    updated_at: Date;
}

const DynamicQRGroupSchema = new Schema<IDynamicQRGroup>(
    {
        label: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            index: true,
        },
        qr_count: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        category_id: {
            type: Schema.Types.ObjectId,
            ref: 'DynamicQRCategory',
            default: null,
        },
        created_by: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

DynamicQRGroupSchema.index({ created_at: -1 });

const DynamicQRGroup = mongoose.model<IDynamicQRGroup>(
    'DynamicQRGroup',
    DynamicQRGroupSchema,
    'dynamic_qr_groups'
);

export default DynamicQRGroup;
