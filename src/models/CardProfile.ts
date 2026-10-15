import mongoose, { Schema, Document } from 'mongoose';

export interface ICardProfile extends Document {
    owner_id: mongoose.Types.ObjectId;
    qr_token: string;

    // Card Details (All optional)
    photo_url?: string;
    name?: string;
    role?: string;
    mobile_number?: string;
    email?: string;
    website?: string;
    instagram?: string;
    location?: string;

    // Subscription Details (Yearly: 365 days)
    activated_at: Date;
    expires_at: Date;
    subscription_days: number;
    is_active: boolean;
    is_blocked: boolean;

    created_at: Date;
    updated_at: Date;
}

const CardProfileSchema = new Schema<ICardProfile>(
    {
        owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        qr_token: { type: String, required: true, unique: true, index: true },

        photo_url: { type: String, default: null },
        name: { type: String, default: '', trim: true },
        role: { type: String, default: '', trim: true },
        mobile_number: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true },
        website: { type: String, default: '', trim: true },
        instagram: { type: String, default: '', trim: true },
        location: { type: String, default: '', trim: true },

        activated_at: { type: Date, default: Date.now },
        expires_at: {
            type: Date,
            default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
            index: true,
        },
        subscription_days: { type: Number, default: 365 },
        is_active: { type: Boolean, default: true },
        is_blocked: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

CardProfileSchema.index({ owner_id: 1, created_at: -1 });

const CardProfile = mongoose.model<ICardProfile>('CardProfile', CardProfileSchema, 'card_profiles');

export default CardProfile;
