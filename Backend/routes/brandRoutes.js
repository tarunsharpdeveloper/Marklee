import express from 'express';
import brandController from '../controllers/brandController.js';
import authenticateToken from '../middlewares/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Brand CRUD operations
router.post('/create', brandController.createBrand);
router.get('/with-projects', brandController.getBrandsWithProjects);

// Tone of Voice operations
router.get('/archetypes/marketing', brandController.getMarketingArchetypes);
router.post('/tone-of-voice', brandController.createToneOfVoice);

// Brand Compliance operations
router.post('/compliance', brandController.createBrandCompliance);
router.get('/compliance/presets', brandController.getCompliancePresets);

// Brand Audience operations
router.post('/audiences', brandController.createBrandAudience);

// AI Generation
router.post('/ai-suggestions', brandController.generateAISuggestions);

// Tone of Voice Chat
router.post('/tone-of-voice-chat', brandController.toneOfVoiceChat);

// LangGraph Workflow Routes
router.post('/workflow/initialize', brandController.initializeBrandWorkflow);
router.post('/workflow/discovery', brandController.processDiscoveryStep);
router.post('/workflow/tone-analysis', brandController.processToneAnalysis);
router.post('/workflow/audience-generation', brandController.processAudienceGeneration);
router.post('/workflow/target-audience-generation', brandController.processTargetAudienceGeneration);
router.post('/workflow/compliance-generation', brandController.processComplianceGeneration);
router.get('/workflow/:workflowId/status', brandController.getWorkflowStatus);

// Brand-specific routes (must come after specific routes to avoid conflicts)
router.get('/:id', brandController.getBrandById);
router.put('/:id', brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);
router.get('/:brandId/tone-of-voice', brandController.getToneOfVoice);
router.get('/:brandId/compliance', brandController.getBrandCompliance);
router.get('/:brandId/audiences/suggested', brandController.getSuggestedAudiences);
router.get('/:brandId/audiences', brandController.getBrandAudiences);

export default router; 