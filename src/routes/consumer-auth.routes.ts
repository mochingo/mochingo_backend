import { Router } from 'express';
import * as consumerAuthController from '../controllers/consumer-auth.controller.js';
import { userAuth } from '../middleware/user-auth.middleware.js';

const router = Router();

router.post('/google', consumerAuthController.loginWithGoogle);
router.post('/logout', consumerAuthController.logout);
router.get('/me', userAuth, consumerAuthController.me);

export default router;
