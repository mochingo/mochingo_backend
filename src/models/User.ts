import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    google_id: string;
    mobile_number?: string;
    profile_picture?: string;
    created_at: Date;
    updated_at: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        google_id: {
            type: String,
            required: true,
            unique: true,
        },
        mobile_number: {
            type: String,
            trim: true,
        },
        profile_picture: {
            type: String,
            trim: true,
        }
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

UserSchema.index({ email: 1 });
UserSchema.index({ google_id: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
