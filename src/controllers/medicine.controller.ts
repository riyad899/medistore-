import { Request, Response } from 'express';
import prisma from '../config/database';
import { MedicineFilters } from '../types';

export const getMedicinesValidation = [];

export const getMedicines = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            page = '1',
            limit = '10',
            category,
            minPrice,
            maxPrice,
            search,
            sellerId
        } = req.query as MedicineFilters;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            isActive: true,
        };

        if (category) {
            where.categoryId = category;
        }

        if (sellerId) {
            where.sellerId = sellerId;
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice as string);
            if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { manufacturer: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [medicines, total] = await Promise.all([
            prisma.medicine.findMany({
                where,
                skip,
                take: limitNum,
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
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.medicine.count({ where }),
        ]);

        // Calculate average rating for each medicine
        const medicinesWithStats = await Promise.all(
            medicines.map(async (medicine) => {
                const reviews = await prisma.review.aggregate({
                    where: { medicineId: medicine.id },
                    _avg: {
                        rating: true,
                    },
                    _count: {
                        rating: true,
                    },
                });

                return {
                    ...medicine,
                    averageRating: reviews._avg.rating || 0,
                    reviewCount: reviews._count.rating || 0,
                };
            })
        );

        res.json({
            medicines: medicinesWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.error('Get medicines error:', error);
        res.status(500).json({ error: 'Failed to fetch medicines' });
    }
};

export const getMedicineById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        const medicine = await prisma.medicine.findUnique({
            where: { id },
            include: {
                category: true,
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                reviews: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5,
                },
            },
        });

        if (!medicine) {
            res.status(404).json({ error: 'Medicine not found' });
            return;
        }

        const stats = await prisma.review.aggregate({
            where: { medicineId: id },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });

        res.json({
            ...medicine,
            averageRating: stats._avg.rating || 0,
            reviewCount: stats._count.rating || 0,
        });
    } catch (error) {
        console.error('Get medicine error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};
