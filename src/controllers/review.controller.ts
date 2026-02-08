import { Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const createReviewValidation = [
    body('medicineId').notEmpty().withMessage('Medicine ID is required'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString(),
];

export const createReview = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { medicineId, rating, comment } = req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Check if customer has ordered this medicine
        const hasOrdered = await prisma.orderItem.findFirst({
            where: {
                medicineId,
                order: {
                    customerId: req.user.id,
                    status: 'DELIVERED',
                },
            },
        });

        if (!hasOrdered) {
            res.status(400).json({
                error: 'You can only review medicines you have purchased and received',
            });
            return;
        }

        // Check if review already exists
        const existingReview = await prisma.review.findUnique({
            where: {
                medicineId_customerId: {
                    medicineId,
                    customerId: req.user.id,
                },
            },
        });

        if (existingReview) {
            res.status(400).json({ error: 'You have already reviewed this medicine' });
            return;
        }

        const review = await prisma.review.create({
            data: {
                medicineId,
                customerId: req.user.id,
                rating,
                comment,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                medicine: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Review created successfully',
            review,
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};

export const getMedicineReviews = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { medicineId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { medicineId },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};
