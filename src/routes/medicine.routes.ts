import { Router } from 'express';
import {
    getMedicines,
    getMedicineById,
} from '../controllers/medicine.controller';

const router = Router();

router.get('/', getMedicines);
router.get('/:id', getMedicineById);

export default router;
