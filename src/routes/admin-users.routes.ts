import { Router } from 'express';
import * as adminUsersController from '../controllers/admin-users.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

router.use(adminAuth);

router.get('/', adminUsersController.listUsers);
router.get('/:userId', adminUsersController.getUserDetails);

export default router;
