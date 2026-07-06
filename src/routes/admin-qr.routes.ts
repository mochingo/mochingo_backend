import { Router } from 'express';
import * as dynamicQRController from '../controllers/dynamic-qr.controller.js';
import { adminAuth } from '../middleware/admin-auth.middleware.js';

const router = Router();

// All admin QR routes require authentication
router.use(adminAuth);

// Dynamic QR Groups (listing + creation)
router.get('/dynamic', dynamicQRController.listDynamicQRs);
router.post('/dynamic', dynamicQRController.createDynamicQR);

// Scan-assign (scan printed QR → assign URL)
router.post('/dynamic/scan-assign', dynamicQRController.scanAssignDynamicQR);

// Batch operations
router.get('/dynamic/batches/:batchId', dynamicQRController.getDynamicQRBatch);
router.post('/dynamic/batches/:batchId/apply-template', dynamicQRController.applyDynamicQRTemplateToBatch);

// Single QR operations
router.get('/dynamic/:dynamicQrId', dynamicQRController.getDynamicQR);
router.patch('/dynamic/:dynamicQrId', dynamicQRController.updateDynamicQR);
router.post('/dynamic/:dynamicQrId/unassign', dynamicQRController.unassignDynamicQR);

export default router;
