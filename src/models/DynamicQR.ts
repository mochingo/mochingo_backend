import mongoose, { Schema, Document } from 'mongoose';

// Mochingo simplified — no outlet/mall. Only manual redirect URL.
export type DynamicQRStatus = 'assigned' | 'unassigned' | 'disabled';

export interface IDynamicQR extends Document {
    token: string;
    label: string;
    group_id?: mongoose.Types.ObjectId | null;
    batch_id?: string | null;
    batch_label?: string | null;
    batch_size?: number | null;
    batch_sequence?: number | null;
    status: DynamicQRStatus;
    manual_redirect_url?: string | null;
    id_value?: string | null;                  // optional display/tracking identifier
    owner_id?: mongoose.Types.ObjectId | null;
    created_by?: mongoose.Types.ObjectId | null;
    assigned_by?: mongoose.Types.ObjectId | null;
    assigned_at?: Date | null;
    last_reassigned_at?: Date | null;
    scan_count: number;
    last_scanned_at?: Date | null;
    created_at: Date;
    updated_at: Date;
}

const DynamicQRSchema = new Schema<IDynamicQR>(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
            lowercase: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        group_id: {
            type: Schema.Types.ObjectId,
            ref: 'DynamicQRGroup',
            default: null,
            index: true,
        },
        batch_id: {
            type: String,
            default: null,
            trim: true,
            index: true,
        },
        batch_label: {
            type: String,
            default: null,
            trim: true,
            maxlength: 120,
        },
        batch_size: {
            type: Number,
            default: null,
            min: 1,
        },
        batch_sequence: {
            type: Number,
            default: null,
            min: 1,
        },
        status: {
            type: String,
            enum: ['assigned', 'unassigned', 'disabled'],
            default: 'unassigned',
            index: true,
        },
        manual_redirect_url: {
            type: String,
            default: null,
            trim: true,
        },
        id_value: {
            type: String,
            default: null,
            trim: true,
        },
        created_by: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
        assigned_by: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            default: null,
        },
        owner_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        assigned_at: {
            type: Date,
            default: null,
        },
        last_reassigned_at: {
            type: Date,
            default: null,
        },
        scan_count: {
            type: Number,
            default: 0,
            min: 0,
        },
        last_scanned_at: {
            type: Date,
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

DynamicQRSchema.index({ label: 1 });
DynamicQRSchema.index({ batch_label: 1 });
DynamicQRSchema.index({ updated_at: -1 });

const DynamicQR = mongoose.model<IDynamicQR>('DynamicQR', DynamicQRSchema, 'dynamic_qrs');

export default DynamicQR;
