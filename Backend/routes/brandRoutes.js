import express from 'express';
import brandController from '../controllers/brandController.js';
import authenticateToken from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Brand CRUD operations
router.post('/create', brandController.createBrand);
router.get('/with-projects', brandController.getBrandsWithProjects);
router.get('/:id', brandController.getBrandById);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

// Tone of Voice operations
router.get('/archetypes/marketing', brandController.getMarketingArchetypes);
router.post('/tone-of-voice', brandController.createToneOfVoice);
router.get('/:brandId/tone-of-voice', brandController.getToneOfVoice);

// Brand Compliance operations
router.post('/compliance', brandController.createBrandCompliance);
router.get('/:brandId/compliance', brandController.getBrandCompliance);
router.get('/compliance/presets', brandController.getCompliancePresets);

// Brand Audience operations
router.get('/:brandId/audiences/suggested', brandController.getSuggestedAudiences);
router.post('/audiences', brandController.createBrandAudience);
router.get('/:brandId/audiences', brandController.getBrandAudiences);

// AI Generation
router.post('/ai-suggestions', brandController.generateAISuggestions);

// Tone of Voice Chat
router.post('/tone-of-voice-chat', brandController.toneOfVoiceChat);

export default router; 