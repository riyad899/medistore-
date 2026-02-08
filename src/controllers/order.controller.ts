import { Response } from 'express';
import { body } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest, OrderFilters } from '../types';
import { OrderStatus } from '@prisma/client';

export const createOrderValidation = [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.medicineId').notEmpty().withMessage('Medicine ID is required'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('shippingCity').notEmpty().withMessage('Shipping city is required'),
    body('shippingZip').notEmpty().withMessage('Shipping ZIP code is required'),
    body('shippingPhone').notEmpty().withMessage('Shipping phone is required'),
    body('notes').optional().isString(),
];

export const createOrder = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { items, shippingAddress, shippingCity, shippingZip, shippingPhone, notes } =
            req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Validate medicines and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const medicine = await prisma.medicine.findUnique({
                where: { id: item.medicineId },
            });

            if (!medicine) {
                res.status(404).json({ error: `Medicine ${item.medicineId} not found` });
                return;
            }

            if (!medicine.isActive) {
                res.status(400).json({ error: `Medicine ${medicine.name} is not available` });
                return;
            }

            if (medicine.stock < item.quantity) {
                res.status(400).json({
                    error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`,
                });
                return;
            }

            const itemTotal = medicine.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                medicineId: medicine.id,
                quantity: item.quantity,
                price: medicine.price,
            });
        }

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: req.user.id,
                totalAmount,
                shippingAddress,
                shippingCity,
                shippingZip,
                shippingPhone,
                notes,
                orderItems: {
                    create: orderItems,
                },
            },
            include: {
                orderItems: {
                    include: {
                        medicine: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            },
        });

        // Update medicine stock
        for (const item of items) {
            await prisma.medicine.update({
                where: { id: item.medicineId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        res.status(201).json({
            message: 'Order placed successfully',
            order,
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

export const getCustomerOrders = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const orders = await prisma.order.findMany({
            where: {
                customerId: req.user.id,
            },
            include: {
                orderItems: {
                    include: {
                        medicine: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
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
        console.error('Get customer orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const getOrderById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                orderItems: {
                    include: {
                        medicine: {
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
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Check if user has access to this order
        const userId = req.user.id;
        const isCustomer = order.customerId === userId;
        const isSeller = order.orderItems.some(
            (item) => item.medicine.sellerId === userId
        );
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isSeller && !isAdmin) {
            res.status(403).json({ error: 'Not authorized to view this order' });
            return;
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

export const getSellerOrders = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Get orders that contain medicines from this seller
        const orders = await prisma.order.findMany({
            where: {
                orderItems: {
                    some: {
                        medicine: {
                            sellerId: req.user.id,
                        },
                    },
                },
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                orderItems: {
                    where: {
                        medicine: {
                            sellerId: req.user.id,
                        },
                    },
                    include: {
                        medicine: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
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
        console.error('Get seller orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const updateOrderStatusValidation = [
    body('status')
        .isIn(['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
        .withMessage('Invalid order status'),
];

export const updateOrderStatus = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Check if seller owns any items in this order
        const userId = req.user.id;
        const isSeller = order.orderItems.some(
            (item) => item.medicine.sellerId === userId
        );

        if (!isSeller) {
            res.status(403).json({ error: 'Not authorized to update this order' });
            return;
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                orderItems: {
                    include: {
                        medicine: true,
                    },
                },
            },
        });

        res.json({
            message: 'Order status updated successfully',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};
