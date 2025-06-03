const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { submitOnboarding, getOnboardingData } = require('../controllers/onboardingController');
const validateRequest = require('../middlewares/validateRequest');
const ValidationSchema = require('../utils/validationSchema');

// Submit onboarding data
router.post('/create', validateRequest(ValidationSchema.onboarding), auth, submitOnboarding);

// Get onboarding data
router.get('/get', auth, getOnboardingData);

module.exports = router; 