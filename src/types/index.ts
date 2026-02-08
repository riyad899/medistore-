import { Request } from 'express';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        name: string;
        image?: string;
    };
    session?: {
        id: string;
        expiresAt: Date;
        userId: string;
    };
}

export interface MedicineFilters {
    page?: any;
    limit?: any;
    category?: string;
    minPrice?: any;
    maxPrice?: any;
    search?: string;
    sellerId?: string;
}

export interface OrderFilters {
    status?: string;
    page?: any;
    limit?: any;
}
