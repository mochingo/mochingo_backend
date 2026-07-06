import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', adminAuth, authController.me);

export default router;
