import { Router } from 'express';
import {
    createOrder,
    getCustomerOrders,
    getOrderById,
    createOrderValidation,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validation';
import { UserRole } from '@prisma/client';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', requireRole(UserRole.CUSTOMER), validate(createOrderValidation), createOrder);
router.get('/', requireRole(UserRole.CUSTOMER), getCustomerOrders);
router.get('/:id', getOrderById);

export default router;
