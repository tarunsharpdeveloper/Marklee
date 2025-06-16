import express from 'express';
import auth from '../middlewares/auth.js';
import { submitOnboarding, getOnboardingData } from '../controllers/onboardingController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { authSchema as onboardingSchema } from '../utils/validationSchema.js';

const router = express.Router();
// Submit onboarding data
router.post('/create', validateRequest(onboardingSchema), auth, submitOnboarding);

// Get onboarding data
router.get('/get', auth, getOnboardingData);

export default router; 