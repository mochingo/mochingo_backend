import { dynamicQRRepository } from '../repositories/dynamic-qr.repository.js';
import User from '../models/User.js';
import { normalizeUrl } from '../utils/crypto.util.js';

export class SalesService {
    async assignQR(data: {
        qr_token: string;
        mobile_number: string;
        name: string;
        place: string;
        business?: string;
        destination_url: string;
        staffId: string;
        isReassign?: boolean;
    }): Promise<void> {
        const { qr_token, mobile_number, name, place, business, destination_url, staffId, isReassign } = data;

        const qr = await dynamicQRRepository.findByToken(qr_token);
        if (!qr) {
            throw new Error('QR Code not found');
        }

        if (qr.status !== 'unassigned' && !isReassign) {
            throw new Error('This QR Code has already been assigned');
        }

        if (isReassign && String(qr.assigned_by) !== String(staffId) && qr.assigned_by) {
            // A simple safety check, though we might allow any staff to reassign in a real company, 
            // but usually it's better to verify. Let's allow it but log it or just let it pass.
            // Actually, for now, we'll allow it if they are logged in.
        }

        let user = null;
        const normalizedMobile = mobile_number ? mobile_number.trim() : '';
        const normalizedName = name ? name.trim() : '';
        const normalizedPlace = place ? place.trim() : '';
        const normalizedBusiness = business ? business.trim() : '';

        if (normalizedMobile || normalizedName || normalizedPlace || normalizedBusiness) {
            if (normalizedMobile) {
                user = await User.findOne({ mobile_number: normalizedMobile });
            }
            
            if (!user) {
                user = await User.create({
                    name: normalizedName || 'Unknown Customer',
                    mobile_number: normalizedMobile || undefined,
                    place: normalizedPlace || undefined,
                    business: normalizedBusiness || undefined,
                    email: `customer_${Date.now()}@mochingo.local`,
                    google_id: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                });
            } else {
                let dirty = false;
                if (!user.name && normalizedName) {
                    user.name = normalizedName;
                    dirty = true;
                }
                if (!user.place && normalizedPlace) {
                    user.place = normalizedPlace;
                    dirty = true;
                }
                if (!user.business && normalizedBusiness) {
                    user.business = normalizedBusiness;
                    dirty = true;
                }
                if (dirty) {
                    await user.save();
                }
            }
        }

        const normalizedUrl = normalizeUrl(destination_url);

        const updateData: any = {
            status: 'assigned',
            manual_redirect_url: normalizedUrl,
            owner_id: user ? user._id : null,
        };

        if (isReassign) {
            updateData.last_reassigned_at = new Date();
        } else {
            updateData.assigned_by = staffId;
            updateData.assigned_at = new Date();
        }

        await dynamicQRRepository.updateById(String(qr._id), updateData);
    }

    async getHistory(staffId: string): Promise<any[]> {
        const QRs = await import('../models/DynamicQR.js').then(m => m.default);
        const history = await QRs.find({ assigned_by: staffId })
            .populate('owner_id', 'name mobile_number place business')
            .sort({ assigned_at: -1, last_reassigned_at: -1 })
            .exec();
        return history;
    }
}

export const salesService = new SalesService();
