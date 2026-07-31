import { Router } from 'express';
import * as staffController from '../controllers/staff.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

router.use(adminAuth); // Require admin authentication

router.post('/', staffController.createStaff);
router.get('/', staffController.getStaffList);
router.patch('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

export default router;
