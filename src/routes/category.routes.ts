import { Router } from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createCategoryValidation,
} from '../controllers/category.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validation';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', getCategories);
router.post(
    '/',
    authenticate,
    requireRole(UserRole.ADMIN),
    validate(createCategoryValidation),
    createCategory
);
router.put(
    '/:id',
    authenticate,
    requireRole(UserRole.ADMIN),
    validate(createCategoryValidation),
    updateCategory
);
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), deleteCategory);

export default router;
