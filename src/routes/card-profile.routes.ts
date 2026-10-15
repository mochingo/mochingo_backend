import { Router } from 'express';
import multer from 'multer';
import * as cardProfileController from '../controllers/card-profile.controller.js';
import { userAuth } from '../middleware/user-auth.middleware.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// Public route to fetch card profile by QR token
router.get('/public/:token', cardProfileController.getCardProfileByToken);

// Protected route to setup/update card profile (accepts multipart/form-data for photo)
router.post('/setup', userAuth, upload.single('photo'), cardProfileController.setupCardProfile);

// Protected route to get user's cards
router.get('/my-cards', userAuth, cardProfileController.getMyCards);

export default router;
