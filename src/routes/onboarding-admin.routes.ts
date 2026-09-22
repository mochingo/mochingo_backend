import { Router } from 'express';
import { adminAuth } from '../middleware/admin-auth.middleware.js';
import * as onboardingController from '../controllers/onboarding.controller.js';

const router = Router();

// All routes require admin auth
router.use(adminAuth);

// GET  /api/admin/onboarding          — list records (supports ?status=new|downloaded|done|active&page=&limit=&search=)
// GET  /api/admin/onboarding/count    — count of 'new' records (for sidebar badge)
// POST /api/admin/onboarding/by-ids   — fetch specific records by IDs (for builder)
// PATCH /api/admin/onboarding/mark-downloaded
// PATCH /api/admin/onboarding/mark-done

router.get('/', onboardingController.getOnboardings);
router.get('/count', onboardingController.getNewCount);
router.post('/by-ids', onboardingController.getRecordsByIds);
router.patch('/mark-downloaded', onboardingController.markDownloaded);
router.patch('/mark-done', onboardingController.markDone);

export default router;
