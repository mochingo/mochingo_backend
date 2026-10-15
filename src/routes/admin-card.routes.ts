import { Router } from 'express';
import * as adminCardController from '../controllers/admin-card.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

// All routes require admin authorization
router.use(adminAuth);

router.get('/', adminCardController.listCards);
router.get('/:id', adminCardController.getCard);
router.patch('/:id', adminCardController.updateCard);
router.delete('/:id', adminCardController.deleteCard);

export default router;
