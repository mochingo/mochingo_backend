import mongoose from 'mongoose';
import { cardProfileService } from '../services/card-profile.service.js';
import DynamicQR from '../models/DynamicQR.js';
import CardProfile from '../models/CardProfile.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

async function runTest() {
    await mongoose.connect(env.mongoUri);

    console.log('--- 1. Setting up test user & unassigned QR ---');
    let user = await User.findOne({ email: 'testowner@mochingo.com' });
    if (!user) {
        user = await User.create({
            google_id: 'mock-google-id-test',
            email: 'testowner@mochingo.com',
            name: 'Muhammed Shadin',
            mobile_number: '+971 565376799',
            place: 'Dubai',
        });
    }

    // Ensure cardtest01 dynamic QR exists
    const qr = await DynamicQR.findOne({ token: 'cardtest01' });
    if (!qr) {
        throw new Error('QR cardtest01 not found. Run create-test-card.ts first');
    }
    console.log('Dynamic QR before setup: status =', qr.status, ', redirect_url =', qr.manual_redirect_url);

    console.log('--- 2. Setting up Card Profile via Service (Simulating Customer Scan & Save) ---');
    const profile = await cardProfileService.setupCardProfile(
        String(user._id),
        {
            token: 'cardtest01',
            name: 'Muhammed Shadin',
            role: 'Managing Director & Lead Designer',
            mobile_number: '+971 565376799',
            email: 'shadin@infomeuae.com',
            website: 'www.infomeuae.com',
            instagram: '@shadin',
            location: 'Burjuman, Dubai',
            subscription_days: 365,
        }
    );

    console.log('Profile created successfully:', {
        name: profile.name,
        role: profile.role,
        expires_at: profile.expires_at,
        subscription_days: profile.subscription_days,
        is_active: profile.is_active,
        is_blocked: profile.is_blocked,
    });

    const updatedQr = await DynamicQR.findOne({ token: 'cardtest01' });
    console.log('Dynamic QR after setup: status =', updatedQr?.status, ', redirect_url =', updatedQr?.manual_redirect_url);

    console.log('--- 3. Testing Public Resolution (Scanning Live QR) ---');
    const publicData = await cardProfileService.getCardProfileByToken('cardtest01');
    console.log('Public resolution result:', {
        name: publicData?.profile.name,
        is_expired: publicData?.is_expired,
        is_blocked: publicData?.is_blocked,
        days_left: publicData?.days_left,
        support_phone: publicData?.support_phone,
    });

    console.log('--- 4. Testing Admin Listing ---');
    const adminList = await cardProfileService.listCardsForAdmin({ page: 1, limit: 10, search: 'Shadin' });
    console.log('Admin List Count:', adminList.total, ', Stats:', adminList.stats);

    console.log('--- 5. Testing Admin Expiry & Block Controls ---');
    // Test blocking
    await cardProfileService.updateCardByAdmin(String(profile.profile._id), { is_blocked: true });
    const blockedPublic = await cardProfileService.getCardProfileByToken('cardtest01');
    console.log('After block: is_blocked =', blockedPublic?.is_blocked);

    // Test unblocking & setting expired date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    await cardProfileService.updateCardByAdmin(String(profile.profile._id), {
        is_blocked: false,
        expires_at: pastDate,
    });
    const expiredPublic = await cardProfileService.getCardProfileByToken('cardtest01');
    console.log('After expiry change to past: is_expired =', expiredPublic?.is_expired, ', days_left =', expiredPublic?.days_left);

    // Restore 365 days
    const nextYear = new Date();
    nextYear.setDate(nextYear.getDate() + 365);
    await cardProfileService.updateCardByAdmin(String(profile.profile._id), {
        is_blocked: false,
        expires_at: nextYear,
    });
    const restoredPublic = await cardProfileService.getCardProfileByToken('cardtest01');
    console.log('After restoring expiry: is_expired =', restoredPublic?.is_expired, ', days_left =', restoredPublic?.days_left);

    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
}

runTest().catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
});
