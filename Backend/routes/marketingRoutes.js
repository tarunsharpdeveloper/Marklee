import express from 'express';
import marketingController from '../controllers/marketingController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get form fields
router.get('/form', marketingController.getFormFields);

// Generate marketing content
router.post('/generate', marketingController.generateMarketingContent);
router.post('/generate-with-prompt', marketingController.generateMarketingContentWithPrompt);

export default router; 