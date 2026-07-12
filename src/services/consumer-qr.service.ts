import { dynamicQRRepository } from '../repositories/dynamic-qr.repository.js';
import User from '../models/User.js';
import { ClaimQRDto } from '../dto/consumer-qr.dto.js';
import { normalizeUrl } from '../utils/crypto.util.js';

export class ConsumerQRService {
    async claimQR(userId: string, dto: ClaimQRDto): Promise<void> {
        const qr = await dynamicQRRepository.findByToken(dto.token);
        if (!qr) {
            throw new Error('QR not found');
        }

        if (qr.status !== 'unassigned') {
            throw new Error('This QR has already been assigned.');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Update user's mobile number if provided and not yet set
        if (dto.mobile_number && !user.mobile_number) {
            user.mobile_number = dto.mobile_number;
            await user.save();
        }

        // Assign the QR
        const normalizedUrl = normalizeUrl(dto.destination_url);
        
        await dynamicQRRepository.updateById(String(qr._id), {
            status: 'assigned',
            manual_redirect_url: normalizedUrl,
            owner_id: user._id,
            assigned_at: new Date(),
        });
    }

    async getMyQRs(userId: string) {
        const qrs = await dynamicQRRepository.findByOwnerId(userId);
        return qrs.map(qr => ({
            id: String(qr._id),
            token: qr.token,
            label: qr.label,
            status: qr.status,
            manual_redirect_url: qr.manual_redirect_url,
            scan_count: qr.scan_count,
            created_at: qr.created_at,
            assigned_at: qr.assigned_at,
        }));
    }

    async updateMyQR(userId: string, qrId: string, destinationUrl: string) {
        const qr = await dynamicQRRepository.findById(qrId);
        if (!qr) throw new Error('QR not found');
        if (String(qr.owner_id) !== String(userId)) {
            throw new Error('Unauthorized to edit this QR');
        }

        const normalizedUrl = normalizeUrl(destinationUrl);
        const updated = await dynamicQRRepository.updateById(qrId, {
            manual_redirect_url: normalizedUrl,
        });
        
        return updated;
    }
}

export const consumerQRService = new ConsumerQRService();
