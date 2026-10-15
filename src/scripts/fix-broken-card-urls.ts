/**
 * fix-broken-card-urls.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time repair script: finds DynamicQR records whose manual_redirect_url
 * is malformed (contains literal "FRONTEND_URL=" or a doubled slash like
 * "https:/www" instead of "https://www") and corrects them to the proper
 * format: https://www.mochingo.com/card/<token>
 *
 * Run with:  npx ts-node -e "import('./src/scripts/fix-broken-card-urls.js')"
 * Or:        tsx src/scripts/fix-broken-card-urls.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DynamicQR from '../models/DynamicQR.js';

dotenv.config();

const CORRECT_FRONTEND = 'https://www.mochingo.com';

async function fixBrokenUrls() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mochingo_db';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Find all assigned QRs with a broken redirect URL
    const broken = await DynamicQR.find({
        status: 'assigned',
        manual_redirect_url: {
            $regex: /FRONTEND_URL=|https:\/[^/]/, // matches "FRONTEND_URL=" or "https:/ " (single slash)
        },
    }).lean();

    console.log(`🔍 Found ${broken.length} QR(s) with broken redirect URLs`);

    let fixed = 0;
    for (const qr of broken) {
        const oldUrl: string = qr.manual_redirect_url as string;

        // Attempt to extract the meaningful path suffix
        // e.g. "FRONTEND_URL=https:/www.mochingo.com/card/dq_abc123" → "/card/dq_abc123"
        let pathSuffix = '';

        // Strip any "FRONTEND_URL=" prefix
        const stripped = oldUrl.replace(/^.*FRONTEND_URL=/i, '').trim();

        // Now stripped might be "https:/www.mochingo.com/card/dq_abc123" or just "/card/dq_abc123"
        try {
            // Fix single-slash protocol to double-slash
            const doubleSlash = stripped.replace(/^(https?:)\/([^/])/, '$1//$2');
            const parsed = new URL(doubleSlash);
            pathSuffix = parsed.pathname; // e.g. "/card/dq_abc123"
        } catch {
            // If still unparseable, try using the token from the QR record
            const cardType = oldUrl.includes('/card/') ? 'card' : oldUrl.includes('/pet/') ? 'pet' : null;
            if (cardType) {
                pathSuffix = `/${cardType}/${qr.token}`;
            } else {
                console.warn(`⚠️  Could not fix QR ${qr.token} — URL: ${oldUrl}`);
                continue;
            }
        }

        const newUrl = `${CORRECT_FRONTEND}${pathSuffix}`;
        await DynamicQR.updateOne({ _id: qr._id }, { $set: { manual_redirect_url: newUrl } });
        console.log(`  ✅ Fixed: ${qr.token}\n     ${oldUrl}\n     → ${newUrl}`);
        fixed++;
    }

    console.log(`\n🎉 Done. Fixed ${fixed} of ${broken.length} QR(s).`);
    await mongoose.disconnect();
}

fixBrokenUrls().catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
