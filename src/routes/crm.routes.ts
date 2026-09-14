import { Router } from 'express';
import * as crmController from '../controllers/crm.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

router.use(adminAuth);

router.get('/categories', crmController.getCategories);
router.post('/categories', crmController.createCategory);

router.get('/leads', crmController.getCustomerData);
router.post('/leads', crmController.createCustomerData);
router.get('/leads/check-mobile/:number', crmController.checkCustomerExists);

export default router;
