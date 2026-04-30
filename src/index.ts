import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth';
import medicineRoutes from './routes/medicine.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import sellerRoutes from './routes/seller.routes';
import adminRoutes from './routes/admin.routes';
import reviewRoutes from './routes/review.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5001;

// CORS must be applied early so preflight requests are handled
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

// ── Better Auth routes ──────────────────────────────────────────────
// IMPORTANT: Mount BEFORE express.json() — better-auth parses its own
// request bodies and express.json() can interfere with that.
// Mount directly on `app` (not via Router) because Express Routers
// strip the mount prefix from req.url, which breaks toNodeHandler.
app.all("/api/auth/*", async (req: Request, res: Response) => {
    // Some clients call `/sign-up` or `/sign-in` without the `/email` suffix.
    // Better Auth expects `/sign-up/email` and `/sign-in/email`.
    if (req.url === "/api/auth/sign-up") {
        req.url = "/api/auth/sign-up/email";
    } else if (req.url === "/api/auth/sign-in") {
        req.url = "/api/auth/sign-in/email";
    }

    return toNodeHandler(auth)(req as any, res as any);
});

// ── Body parsing (after auth) ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (_req, res) => {
    res.json({
        message: 'MediStore API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            medicines: '/api/medicines',
            categories: '/api/categories',
            orders: '/api/orders',
            seller: '/api/seller',
            admin: '/api/admin',
            reviews: '/api/reviews',
        },
    });
});

app.use('/api/medicines', medicineRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MediStore API server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
});

export default app;
