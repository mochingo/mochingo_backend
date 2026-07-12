import { Router } from 'express';
import * as consumerQRController from '../controllers/consumer-qr.controller.js';
import { userAuth } from '../middleware/user-auth.middleware.js';

const router = Router();

router.post('/claim', userAuth, consumerQRController.claimQR);
router.get('/', userAuth, consumerQRController.getMyQRs);
router.patch('/:id', userAuth, consumerQRController.updateMyQR);

export default router;
