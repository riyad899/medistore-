import { Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database';

export const getCategories = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
            include: {
                _count: {
                    select: {
                        medicines: true,
                    },
                },
            },
        });

        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

export const createCategoryValidation = [
    body('name').notEmpty().withMessage('Category name is required'),
    body('description').optional().isString(),
];

export const createCategory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { name, description } = req.body;

        const category = await prisma.category.create({
            data: {
                name,
                description,
            },
        });

        res.status(201).json({
            message: 'Category created successfully',
            category,
        });
    } catch (error: any) {
        console.error('Create category error:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Category name already exists' });
            return;
        }
        res.status(500).json({ error: 'Failed to create category' });
    }
};

export const updateCategory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                description,
            },
        });

        res.json({
            message: 'Category updated successfully',
            category,
        });
    } catch (error: any) {
        console.error('Update category error:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to update category' });
    }
};

export const deleteCategory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.category.delete({
            where: { id },
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        console.error('Delete category error:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
