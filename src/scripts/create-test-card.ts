import mongoose from 'mongoose';
import DynamicQRCategory from '../models/DynamicQRCategory.js';
import DynamicQRGroup from '../models/DynamicQRGroup.js';
import DynamicQR from '../models/DynamicQR.js';
import CardProfile from '../models/CardProfile.js';
import { env } from '../config/env.js';

async function main() {
    await mongoose.connect(env.mongoUri);

    let cardCat = await DynamicQRCategory.findOne({ slug: 'card' });
    if (!cardCat) {
        cardCat = await DynamicQRCategory.create({
            name: 'Digital Card',
            slug: 'card',
            description: 'Digital Profile & Business Card QR',
        });
    }

    // Clean up previous test
    await DynamicQR.deleteOne({ token: 'cardtest01' });
    await CardProfile.deleteOne({ qr_token: 'cardtest01' });

    const group = await DynamicQRGroup.create({
        label: 'Test Card Batch',
        qr_count: 1,
        category_id: cardCat._id,
    });

    const qr = await DynamicQR.create({
        token: 'cardtest01',
        group_id: group._id,
        label: 'Test Card 1',
        status: 'unassigned',
        sequence: 1,
    });

    console.log('SUCCESS: Created test Dynamic QR with token:', qr.token);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
