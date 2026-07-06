import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
    name: string;
    email: string;
    password_hash: string;
    role: 'super_admin' | 'admin';
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const AdminSchema = new Schema<IAdmin>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        password_hash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['super_admin', 'admin'],
            default: 'admin',
        },
        is_active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

const Admin = mongoose.model<IAdmin>('Admin', AdminSchema, 'admins');

export default Admin;
