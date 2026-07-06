import { Router } from 'express';
import * as dynamicQRController from '../controllers/dynamic-qr.controller.js';

const router = Router();

// Public — no auth required. Called by the frontend /dq/[token] page.
router.get('/dynamic/:token/resolve', dynamicQRController.resolveDynamicQR);

export default router;
