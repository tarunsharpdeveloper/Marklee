import express from 'express';
import auth from '../middlewares/auth.js';
import onboardingController from '../controllers/onboardingController.js';
import validateRequest from '../middlewares/validateRequest.js';
import authSchema  from '../utils/validationSchema.js';

const router = express.Router();
// Submit onboarding data
router.post('/create', validateRequest(authSchema.onboarding), auth, onboardingController.submitOnboarding);

// Get onboarding data
router.get('/get', auth, onboardingController.getOnboardingData);
router.post('/user', auth, onboardingController.createOnboardingUser);
router.post('/update', auth, onboardingController.updateOnboardingData);
router.post('/core-message', auth, onboardingController.updateCoreMessage);
router.post('/core-message-seen', auth, onboardingController.markCoreMessageSeen);

// Get and update current form step
router.get('/current-step', auth, onboardingController.getCurrentFormStep);
router.post('/current-step', auth, onboardingController.updateCurrentFormStep);

export default router; 