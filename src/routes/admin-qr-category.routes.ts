import { Router } from 'express';
import * as categoryController from '../controllers/dynamic-qr-category.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

router.use(adminAuth);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.get('/:id', categoryController.getCategory);
router.patch('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;
