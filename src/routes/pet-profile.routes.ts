import { Router } from 'express';
import multer from 'multer';
import * as petProfileController from '../controllers/pet-profile.controller.js';
import { userAuth } from '../middleware/user-auth.middleware.js';

// Setup multer for memory storage (buffer)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// Public route to fetch pet profile by token
router.get('/public/:token', petProfileController.getPetProfileByToken);

// Protected route to setup/update pet profile (accepts multipart/form-data for image)
router.post('/setup', userAuth, upload.single('profile_photo'), petProfileController.setupPetProfile);

export default router;
