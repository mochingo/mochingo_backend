import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import { env } from './config/env.js';

process.on('uncaughtException', (error) => {
    console.error('💀 Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled Rejection:', reason);
});

process.on('SIGTERM', () => {
    console.warn('🛑 SIGTERM received — shutting down');
    process.exit(0);
});

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        app.listen(env.port, '0.0.0.0', () => {
            console.log(`🚀 Mochingo backend running on http://localhost:${env.port}`);
            console.log(`📦 Environment: ${env.nodeEnv}`);
            console.log(`🌐 Frontend URL: ${env.frontendUrl}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();