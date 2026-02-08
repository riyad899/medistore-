import { Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { AuthRequest } from '../types';
import { fromNodeHeaders } from "better-auth/node";

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            res.status(401).json({ error: 'Unauthorized: No active session' });
            return;
        }

        req.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: (session.user as any).role || 'CUSTOMER',
            image: session.user.image || undefined,
        };

        req.session = {
            id: session.session.id,
            expiresAt: session.session.expiresAt,
            userId: session.session.userId,
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};
