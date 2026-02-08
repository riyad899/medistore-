import { Router } from 'express';
import {
    getAllUsers,
    updateUserStatus,
    getAllOrders,
    getAllMedicines,
    updateUserStatusValidation,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validation';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireRole(UserRole.ADMIN));

router.get('/users', getAllUsers);
router.patch('/users/:id', validate(updateUserStatusValidation), updateUserStatus);
router.get('/orders', getAllOrders);
router.get('/medicines', getAllMedicines);

export default router;
