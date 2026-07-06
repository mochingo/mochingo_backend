import mongoose from 'mongoose';
import { env } from './env.js';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.mongoUri);
        console.log(`✅ MongoDB connected: ${conn.connection.host} — db: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

export default connectDB;
