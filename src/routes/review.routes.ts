import { Router } from 'express';
import {
    createReview,
    getMedicineReviews,
    createReviewValidation,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validation';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
    '/',
    authenticate,
    requireRole(UserRole.CUSTOMER),
    validate(createReviewValidation),
    createReview
);
router.get('/medicine/:medicineId', getMedicineReviews);

export default router;
