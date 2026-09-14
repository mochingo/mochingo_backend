import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import adminQRRoutes from './routes/admin-qr.routes.js';
import adminQRCategoryRoutes from './routes/admin-qr-category.routes.js';
import adminUsersRoutes from './routes/admin-users.routes.js';
import consumerAuthRoutes from './routes/consumer-auth.routes.js';
import consumerQRRoutes from './routes/consumer-qr.routes.js';
import publicQRRoutes from './routes/public-qr.routes.js';
import petProfileRoutes from './routes/pet-profile.routes.js';
import staffRoutes from './routes/staff.routes.js';
import salesRoutes from './routes/sales.routes.js';
import crmRoutes from './routes/crm.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const localNetPattern = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/;
        const isAllowed = env.corsAllowedOrigins.includes(origin) || localNetPattern.test(origin);
        if (isAllowed) return callback(null, true);
        callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
}));

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.url}`);
    next();
});

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mochingo-backend', timestamp: new Date().toISOString() });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin/qr/categories', adminQRCategoryRoutes);
app.use('/api/admin/qr', adminQRRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/consumer/auth', consumerAuthRoutes);
app.use('/api/consumer/qr', consumerQRRoutes);
app.use('/api/pet-profile', petProfileRoutes);
app.use('/api/qr', publicQRRoutes);
app.use('/api/admin/staff', staffRoutes);
app.use('/api/admin/sales', salesRoutes);
app.use('/api/admin/crm', crmRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ status: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
