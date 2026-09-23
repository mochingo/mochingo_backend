import OnboardingRecord from '../models/OnboardingRecord.js';

export class OnboardingService {

    // ── Webhook ────────────────────────────────────────────────────────────────

    async createRecord(data: {
        name: string;
        professional_name?: string;
        qualification?: string;
        dob?: string;
        pulse_visit_id?: string;
        registration_no?: string;
        service_area?: string;
        qr_link?: string;
        photo_url?: string;
        source_app?: string;
    }) {
        return OnboardingRecord.create({
            name: data.name.trim(),
            professional_name: data.professional_name?.trim() || null,
            qualification: data.qualification?.trim() || null,
            dob: data.dob?.trim() || null,
            pulse_visit_id: data.pulse_visit_id?.trim() || null,
            registration_no: data.registration_no?.trim() || null,
            service_area: data.service_area?.trim() || null,
            qr_link: data.qr_link?.trim() || null,
            photo_url: data.photo_url?.trim() || null,
            source_app: data.source_app?.trim() || null,
            status: 'new',
        });
    }

    // ── Update by pulse_visit_id ───────────────────────────────────────────────

    async updateByPulseVisitId(pulse_visit_id: string, data: {
        name?: string;
        professional_name?: string;
        qualification?: string;
        dob?: string;
        registration_no?: string;
        service_area?: string;
        qr_link?: string;
        photo_url?: string;
    }) {
        const record = await OnboardingRecord.findOne({ pulse_visit_id: pulse_visit_id.trim() });
        if (!record) return null;

        // Only update fields that were explicitly provided in the request body
        const updates: Record<string, any> = {};
        if (data.name            !== undefined) updates.name            = data.name.trim();
        if (data.professional_name!== undefined) updates.professional_name= data.professional_name?.trim() || null;
        if (data.qualification   !== undefined) updates.qualification   = data.qualification?.trim() || null;
        if (data.dob             !== undefined) updates.dob             = data.dob?.trim() || null;
        if (data.registration_no !== undefined) updates.registration_no = data.registration_no?.trim() || null;
        if (data.service_area    !== undefined) updates.service_area    = data.service_area?.trim() || null;
        if (data.qr_link         !== undefined) updates.qr_link         = data.qr_link?.trim() || null;
        if (data.photo_url       !== undefined) updates.photo_url       = data.photo_url?.trim() || null;

        Object.assign(record, updates);
        await record.save();
        return record;
    }

    // ── Admin List ─────────────────────────────────────────────────────────────

    async listRecords(opts: {
        status?: string;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const { page = 1, limit = 100, search = '', status } = opts;

        const query: Record<string, any> = {};

        if (status === 'done') {
            query.status = 'done';
        } else if (status === 'new') {
            query.status = 'new';
        } else if (status === 'downloaded') {
            query.status = 'downloaded';
        } else {
            // Default: active tab = new + downloaded
            query.status = { $in: ['new', 'downloaded'] };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registration_no: { $regex: search, $options: 'i' } },
                { service_area: { $regex: search, $options: 'i' } },
                { pulse_visit_id: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await OnboardingRecord.countDocuments(query);
        const records = await OnboardingRecord.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec();

        return {
            records,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    async getNewCount(): Promise<number> {
        return OnboardingRecord.countDocuments({ status: 'new' });
    }

    // ── Status Transitions ─────────────────────────────────────────────────────

    async markDownloaded(ids: string[]) {
        return OnboardingRecord.updateMany(
            { _id: { $in: ids } },
            { $set: { status: 'downloaded', downloaded_at: new Date() } }
        );
    }

    async markDone(ids: string[]) {
        return OnboardingRecord.updateMany(
            { _id: { $in: ids } },
            { $set: { status: 'done', done_at: new Date() } }
        );
    }

    // ── Single record (for builder) ────────────────────────────────────────────

    async getRecordsByIds(ids: string[]) {
        return OnboardingRecord.find({ _id: { $in: ids } }).lean().exec();
    }
}

export const onboardingService = new OnboardingService();
