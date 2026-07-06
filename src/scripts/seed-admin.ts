/**
 * Seed script — creates the default Mochingo admin user.
 * Usage: npm run seed:admin
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import Admin from '../models/Admin.js';

const seedAdmin = async (): Promise<void> => {
    await connectDB();

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@mochingo.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const name = process.env.SEED_ADMIN_NAME || 'Mochingo Admin';

    const existing = await Admin.findOne({ email });
    if (existing) {
        console.log(`✅ Admin already exists: ${email}`);
        process.exit(0);
    }

    const password_hash = await bcrypt.hash(password, 12);
    await Admin.create({ name, email, password_hash, role: 'super_admin', is_active: true });
    console.log(`✅ Admin created successfully!`);
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    process.exit(0);
};

seedAdmin().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
