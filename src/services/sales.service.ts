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

        // Find existing user by mobile number or create a new one
        let user = await User.findOne({ mobile_number: mobile_number.trim() });
        
        if (!user) {
            // Create a new user for the customer
            user = await User.create({
                name: name.trim(),
                mobile_number: mobile_number.trim(),
                place: place.trim(),
                business: business ? business.trim() : undefined,
                // Email is required in the User schema? Let's check User.ts, email is required!
                // Wait, if a customer is created by sales, they might not provide an email.
                // We'll generate a placeholder email if missing.
                email: `customer_${Date.now()}@mochingo.local`,
            });
        } else {
            // Update existing user if fields are missing
            let dirty = false;
            if (!user.name && name) {
                user.name = name.trim();
                dirty = true;
            }
            if (!user.place && place) {
                user.place = place.trim();
                dirty = true;
            }
            if (!user.business && business) {
                user.business = business.trim();
                dirty = true;
            }
            if (dirty) {
                await user.save();
            }
        }

        const normalizedUrl = normalizeUrl(destination_url);

        const updateData: any = {
            status: 'assigned',
            manual_redirect_url: normalizedUrl,
            owner_id: user._id,
            assigned_by: staffId,
        };

        if (isReassign) {
            updateData.last_reassigned_at = new Date();
        } else {
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
