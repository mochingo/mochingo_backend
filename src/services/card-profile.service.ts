import CardProfile, { ICardProfile } from '../models/CardProfile.js';
import { dynamicQRRepository } from '../repositories/dynamic-qr.repository.js';
import User from '../models/User.js';
import { SetupCardProfileDto } from '../dto/card-profile.dto.js';
import { uploadToCloudinary } from '../utils/cloudinary.util.js';

export interface CardProfileResponse {
    profile: ICardProfile;
    is_expired: boolean;
    is_blocked: boolean;
    expires_at: Date;
    days_left: number;
    support_phone: string;
}

class CardProfileService {
    async setupCardProfile(
        userId: string,
        dto: SetupCardProfileDto,
        imageBuffer?: Buffer,
        imageMimeType: string = 'image/jpeg'
    ): Promise<CardProfileResponse> {
        // 1. Verify QR exists
        const qr = await dynamicQRRepository.findByToken(dto.token);
        if (!qr) {
            throw new Error('QR code not found');
        }

        // 2. Authorization check
        if (qr.status !== 'unassigned') {
            if (qr.owner_id && String(qr.owner_id) !== String(userId)) {
                throw new Error('This QR code is already assigned to someone else.');
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 3. Handle image upload with robust fallback
        let photo_url: string | undefined = dto.photo_url || undefined;
        if (imageBuffer) {
            try {
                photo_url = await uploadToCloudinary(imageBuffer, 'mochingo/cards');
            } catch (cloudErr) {
                console.warn('Cloudinary upload failed, falling back to base64 data URI:', cloudErr);
                photo_url = `data:${imageMimeType};base64,${imageBuffer.toString('base64')}`;
            }
        }

        const profileData: any = {
            name: dto.name || '',
            role: dto.role || '',
            mobile_number: dto.mobile_number || '',
            email: dto.email || '',
            website: dto.website || '',
            instagram: dto.instagram || '',
            location: dto.location || '',
            owner_id: user._id,
            qr_token: dto.token,
        };

        if (photo_url) {
            profileData.photo_url = photo_url;
        }

        // 4. Check if card profile already exists
        let cardProfile = await CardProfile.findOne({ qr_token: dto.token });

        if (cardProfile) {
            if (String(cardProfile.owner_id) !== String(userId)) {
                throw new Error('Unauthorized to edit this card profile');
            }
            cardProfile = await CardProfile.findOneAndUpdate(
                { qr_token: dto.token },
                profileData,
                { new: true }
            );
        } else {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
            profileData.activated_at = now;
            profileData.expires_at = expiresAt;
            profileData.subscription_days = 365;
            profileData.is_active = true;

            cardProfile = await CardProfile.create(profileData);
        }

        // 5. Update Dynamic QR to assigned with card destination
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendBaseUrl}/card/${dto.token}`;

        await dynamicQRRepository.updateById(String(qr._id), {
            status: 'assigned',
            owner_id: user._id,
            manual_redirect_url: redirectUrl,
            assigned_at: qr.assigned_at || new Date(),
        });

        // 6. Update user basic info if not set
        let userDirty = false;
        if (!user.name && dto.name) {
            user.name = dto.name;
            userDirty = true;
        }
        if (!user.mobile_number && dto.mobile_number) {
            user.mobile_number = dto.mobile_number;
            userDirty = true;
        }
        if (userDirty) {
            await user.save();
        }

        const now = new Date();
        const expiresAt = cardProfile!.expires_at;
        const isExpired = expiresAt ? now.getTime() > new Date(expiresAt).getTime() : false;
        const daysLeft = expiresAt
            ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 365;

        return {
            profile: cardProfile!,
            is_expired: isExpired,
            is_blocked: Boolean(cardProfile!.is_blocked || cardProfile!.is_active === false),
            expires_at: expiresAt,
            days_left: daysLeft,
            support_phone: '7012254579',
        };
    }

    async getCardProfileByToken(token: string): Promise<CardProfileResponse | null> {
        const card = await CardProfile.findOne({ qr_token: token });
        if (!card) {
            return null;
        }

        const now = new Date();
        const expiresAt = card.expires_at;
        const isExpired = expiresAt ? now.getTime() > new Date(expiresAt).getTime() : false;
        const isBlocked = Boolean(card.is_blocked || card.is_active === false);
        const daysLeft = expiresAt
            ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        return {
            profile: card,
            is_expired: isExpired,
            is_blocked: isBlocked,
            expires_at: expiresAt,
            days_left: daysLeft,
            support_phone: '7012254579',
        };
    }

    async getMyCards(userId: string): Promise<any[]> {
        const cards = await CardProfile.find({ owner_id: userId }).sort({ created_at: -1 });
        const now = new Date();
        return cards.map((card) => {
            const expiresAt = card.expires_at;
            const isExpired = expiresAt ? now.getTime() > new Date(expiresAt).getTime() : false;
            const isBlocked = Boolean(card.is_blocked || card.is_active === false);
            const daysLeft = expiresAt
                ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                : 0;
            return {
                ...card.toObject(),
                is_expired: isExpired,
                is_blocked: isBlocked,
                days_left: daysLeft,
                support_phone: '7012254579',
            };
        });
    }

    // ─── Admin Methods ────────────────────────────────────────────────────────

    async listCardsForAdmin(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: 'all' | 'active' | 'expired' | 'blocked';
    }): Promise<{
        cards: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        stats: {
            total: number;
            active: number;
            expired: number;
            blocked: number;
        };
    }> {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;
        const search = String(params.search || '').trim();
        const status = params.status || 'all';

        const now = new Date();

        // 1. Overall Stats
        const [total, blocked, expired, active] = await Promise.all([
            CardProfile.countDocuments({}),
            CardProfile.countDocuments({ $or: [{ is_blocked: true }, { is_active: false }] }),
            CardProfile.countDocuments({
                expires_at: { $lte: now },
                is_blocked: { $ne: true },
                is_active: { $ne: false },
            }),
            CardProfile.countDocuments({
                expires_at: { $gt: now },
                is_blocked: { $ne: true },
                is_active: { $ne: false },
            }),
        ]);

        // 2. Build Query
        const query: any = {};

        if (search) {
            const safeRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: safeRegex, $options: 'i' } },
                { role: { $regex: safeRegex, $options: 'i' } },
                { mobile_number: { $regex: safeRegex, $options: 'i' } },
                { email: { $regex: safeRegex, $options: 'i' } },
                { qr_token: { $regex: safeRegex, $options: 'i' } },
                { location: { $regex: safeRegex, $options: 'i' } },
            ];
        }

        if (status === 'active') {
            query.expires_at = { $gt: now };
            query.is_blocked = { $ne: true };
            query.is_active = { $ne: false };
        } else if (status === 'expired') {
            query.expires_at = { $lte: now };
            query.is_blocked = { $ne: true };
            query.is_active = { $ne: false };
        } else if (status === 'blocked') {
            query.$or = [{ is_blocked: true }, { is_active: false }];
        }

        const [records, count] = await Promise.all([
            CardProfile.find(query)
                .populate('owner_id', 'name email mobile_number profile_picture')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit),
            CardProfile.countDocuments(query),
        ]);

        const mappedCards = records.map((card) => {
            const expiresAt = card.expires_at;
            const cardIsExpired = expiresAt ? now.getTime() > new Date(expiresAt).getTime() : false;
            const cardIsBlocked = Boolean(card.is_blocked || card.is_active === false);
            const daysLeft = expiresAt
                ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                : 0;

            return {
                ...card.toObject(),
                id: String(card._id),
                is_expired: cardIsExpired,
                is_blocked: cardIsBlocked,
                days_left: daysLeft,
            };
        });

        return {
            cards: mappedCards,
            total: count,
            page,
            limit,
            total_pages: Math.ceil(count / limit) || 1,
            stats: {
                total,
                active,
                expired,
                blocked,
            },
        };
    }

    async getCardByIdForAdmin(cardId: string): Promise<any> {
        const card = await CardProfile.findById(cardId).populate(
            'owner_id',
            'name email mobile_number profile_picture'
        );
        if (!card) {
            throw new Error('Card profile not found');
        }
        const now = new Date();
        const expiresAt = card.expires_at;
        const isExpired = expiresAt ? now.getTime() > new Date(expiresAt).getTime() : false;
        const isBlocked = Boolean(card.is_blocked || card.is_active === false);
        const daysLeft = expiresAt
            ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        return {
            ...card.toObject(),
            id: String(card._id),
            is_expired: isExpired,
            is_blocked: isBlocked,
            days_left: daysLeft,
        };
    }

    async updateCardByAdmin(
        cardId: string,
        data: {
            expires_at?: string | Date;
            extend_days?: number;
            is_blocked?: boolean;
            is_active?: boolean;
            name?: string;
            role?: string;
            mobile_number?: string;
            email?: string;
            website?: string;
            instagram?: string;
            location?: string;
        }
    ): Promise<any> {
        const card = await CardProfile.findById(cardId);
        if (!card) {
            throw new Error('Card profile not found');
        }

        const updates: any = {};

        if (data.name !== undefined) updates.name = data.name.trim();
        if (data.role !== undefined) updates.role = data.role.trim();
        if (data.mobile_number !== undefined) updates.mobile_number = data.mobile_number.trim();
        if (data.email !== undefined) updates.email = data.email.trim();
        if (data.website !== undefined) updates.website = data.website.trim();
        if (data.instagram !== undefined) updates.instagram = data.instagram.trim();
        if (data.location !== undefined) updates.location = data.location.trim();

        // Handle Expiry Extension or Explicit Date
        if (data.extend_days && Number(data.extend_days) > 0) {
            const currentExpiry = card.expires_at ? new Date(card.expires_at) : new Date();
            const baseTime = currentExpiry.getTime() > Date.now() ? currentExpiry.getTime() : Date.now();
            updates.expires_at = new Date(baseTime + Number(data.extend_days) * 24 * 60 * 60 * 1000);
        } else if (data.expires_at) {
            const parsedDate = new Date(data.expires_at);
            if (!isNaN(parsedDate.getTime())) {
                updates.expires_at = parsedDate;
            }
        }

        // Handle Block / Unblock
        if (data.is_blocked !== undefined) {
            updates.is_blocked = Boolean(data.is_blocked);
            updates.is_active = !data.is_blocked;
        } else if (data.is_active !== undefined) {
            updates.is_active = Boolean(data.is_active);
            updates.is_blocked = !data.is_active;
        }

        const updated = await CardProfile.findByIdAndUpdate(cardId, { $set: updates }, { new: true }).populate(
            'owner_id',
            'name email mobile_number profile_picture'
        );

        const now = new Date();
        const expiresAt = updated!.expires_at;
        const isExpired = expiresAt ? now.getTime() > new Date(expiresAt).getTime() : false;
        const isBlocked = Boolean(updated!.is_blocked || updated!.is_active === false);
        const daysLeft = expiresAt
            ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        return {
            ...updated!.toObject(),
            id: String(updated!._id),
            is_expired: isExpired,
            is_blocked: isBlocked,
            days_left: daysLeft,
        };
    }

    async deleteCardByAdmin(cardId: string): Promise<void> {
        const card = await CardProfile.findById(cardId);
        if (!card) throw new Error('Card profile not found');

        // Reset dynamic QR to unassigned if exists
        if (card.qr_token) {
            await dynamicQRRepository.updateByToken(card.qr_token, {
                $set: {
                    status: 'unassigned',
                    manual_redirect_url: null,
                    owner_id: null,
                },
            });
        }

        await CardProfile.findByIdAndDelete(cardId);
    }
}

export const cardProfileService = new CardProfileService();
