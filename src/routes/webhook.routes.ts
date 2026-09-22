import { Router } from 'express';
import { webhookApiKey } from '../middleware/webhook-api-key.middleware.js';
import { receiveOnboarding, updateOnboarding } from '../controllers/onboarding.controller.js';

const router = Router();

// POST /api/webhook/onboarding         — create new onboarding record
router.post('/onboarding', webhookApiKey, receiveOnboarding);

// PUT  /api/webhook/onboarding/update  — update existing record by pulse_visit_id
router.put('/onboarding/update', webhookApiKey, updateOnboarding);

export default router;
