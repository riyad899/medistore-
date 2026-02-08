import { Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const createMedicineValidation = [
    body('name').notEmpty().withMessage('Medicine name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
    body('categoryId').notEmpty().withMessage('Category is required'),
    body('imageUrl').optional().isURL(),
];

export const createMedicine = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { name, description, price, stock, manufacturer, categoryId, imageUrl } =
            req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const medicine = await prisma.medicine.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                manufacturer,
                categoryId,
                sellerId: req.user.id,
                imageUrl,
            },
            include: {
                category: true,
            },
        });

        res.status(201).json({
            message: 'Medicine created successfully',
            medicine,
        });
    } catch (error) {
        console.error('Create medicine error:', error);
        res.status(500).json({ error: 'Failed to create medicine' });
    }
};

export const updateMedicine = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, manufacturer, categoryId, imageUrl } =
            req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Check if medicine belongs to seller
        const existingMedicine = await prisma.medicine.findUnique({
            where: { id },
        });

        if (!existingMedicine) {
            res.status(404).json({ error: 'Medicine not found' });
            return;
        }

        if (existingMedicine.sellerId !== req.user.id) {
            res.status(403).json({ error: 'Not authorized to update this medicine' });
            return;
        }

        const medicine = await prisma.medicine.update({
            where: { id },
            data: {
                name,
                description,
                price: price ? parseFloat(price) : undefined,
                stock: stock ? parseInt(stock) : undefined,
                manufacturer,
                categoryId,
                imageUrl,
            },
            include: {
                category: true,
            },
        });

        res.json({
            message: 'Medicine updated successfully',
            medicine,
        });
    } catch (error) {
        console.error('Update medicine error:', error);
        res.status(500).json({ error: 'Failed to update medicine' });
    }
};

export const deleteMedicine = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Check if medicine belongs to seller
        const existingMedicine = await prisma.medicine.findUnique({
            where: { id },
        });

        if (!existingMedicine) {
            res.status(404).json({ error: 'Medicine not found' });
            return;
        }

        if (existingMedicine.sellerId !== req.user.id) {
            res.status(403).json({ error: 'Not authorized to delete this medicine' });
            return;
        }

        await prisma.medicine.delete({
            where: { id },
        });

        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error('Delete medicine error:', error);
        res.status(500).json({ error: 'Failed to delete medicine' });
    }
};

export const getSellerMedicines = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const medicines = await prisma.medicine.findMany({
            where: {
                sellerId: req.user.id,
            },
            include: {
                category: true,
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
        console.error('Get seller medicines error:', error);
        res.status(500).json({ error: 'Failed to fetch medicines' });
    }
};
