import mongoose, { Schema, Document } from 'mongoose';

export type OnboardingStatus = 'new' | 'downloaded' | 'done';

export interface IOnboardingRecord extends Document {
    // ── ID Card Fields ──────────────────────────────────────────────────────────
    name: string;
    professional_name?: string | null;
    qualification?: string | null;
    dob?: string | null;
    pulse_visit_id?: string | null;
    registration_no?: string | null;
    service_area?: string | null;
    qr_link?: string | null;
    photo_url?: string | null;

    // ── To add a new field in the future:
    //    1. Add it here (e.g. blood_group?: string | null)
    //    2. Add its schema entry below
    //    3. Add { key: 'blood_group', label: 'Blood Group', type: 'text' } to FIELD_REGISTRY in the frontend

    // ── Metadata ────────────────────────────────────────────────────────────────
    source_app?: string | null;

    // ── Status ──────────────────────────────────────────────────────────────────
    status: OnboardingStatus;
    downloaded_at?: Date | null;
    done_at?: Date | null;

    created_at: Date;
    updated_at: Date;
}

const OnboardingRecordSchema = new Schema<IOnboardingRecord>(
    {
        // ── ID Card Fields ──────────────────────────────────────────────────────
        name: {
            type: String,
            required: true,
            trim: true,
        },
        professional_name: {
            type: String,
            default: null,
            trim: true,
        },
        qualification: {
            type: String,
            default: null,
            trim: true,
        },
        dob: {
            type: String,
            default: null,
            trim: true,
        },
        pulse_visit_id: {
            type: String,
            default: null,
            trim: true,
        },
        registration_no: {
            type: String,
            default: null,
            trim: true,
            index: true,
        },
        service_area: {
            type: String,
            default: null,
            trim: true,
        },
        qr_link: {
            type: String,
            default: null,
            trim: true,
        },
        photo_url: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Metadata ────────────────────────────────────────────────────────────
        source_app: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Status ──────────────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ['new', 'downloaded', 'done'],
            default: 'new',
            index: true,
        },
        downloaded_at: {
            type: Date,
            default: null,
        },
        done_at: {
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

OnboardingRecordSchema.index({ created_at: -1 });
OnboardingRecordSchema.index({ name: 1 });

const OnboardingRecord = mongoose.model<IOnboardingRecord>(
    'OnboardingRecord',
    OnboardingRecordSchema,
    'onboarding_records'
);

export default OnboardingRecord;
