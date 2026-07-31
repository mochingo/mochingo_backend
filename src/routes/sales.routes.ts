import { Router } from 'express';
import * as salesController from '../controllers/sales.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

router.use(adminAuth); // Require authentication (must be sales_staff or admin)

router.post('/assign-qr', salesController.assignQR);
router.get('/history', salesController.getHistory);

export default router;
