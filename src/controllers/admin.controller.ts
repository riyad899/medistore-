import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { body } from 'express-validator';

export const getAllUsers = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                address: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUserStatusValidation = [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

export const updateUserStatus = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Prevent admin from deactivating themselves
        if (id === req.user?.id) {
            res.status(400).json({ error: 'You cannot change your own status' });
            return;
        }

        const user = await prisma.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
            },
        });

        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user,
        });
    } catch (error: any) {
        console.error('Update user status error:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

export const getAllOrders = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                orderItems: {
                    include: {
                        medicine: {
                            select: {
                                id: true,
                                name: true,
                                seller: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ orders });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const getAllMedicines = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const medicines = await prisma.medicine.findMany({
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        reviews: true,
                        orderItems: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ medicines });
    } catch (error) {
        console.error('Get all medicines error:', error);
        res.status(500).json({ error: 'Failed to fetch medicines' });
    }
};
