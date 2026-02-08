import { Router } from 'express';
import {
    createMedicine,
    updateMedicine,
    deleteMedicine,
    getSellerMedicines,
    createMedicineValidation,
} from '../controllers/seller.controller';
import {
    getSellerOrders,
    updateOrderStatus,
    updateOrderStatusValidation,
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validation';
import { UserRole } from '@prisma/client';

const router = Router();

// All seller routes require authentication and SELLER role
router.use(authenticate, requireRole(UserRole.SELLER));

// Medicine management
router.get('/medicines', getSellerMedicines);
router.post('/medicines', validate(createMedicineValidation), createMedicine);
router.put('/medicines/:id', validate(createMedicineValidation), updateMedicine);
router.delete('/medicines/:id', deleteMedicine);

// Order management
router.get('/orders', getSellerOrders);
router.patch('/orders/:id', validate(updateOrderStatusValidation), updateOrderStatus);

export default router;
