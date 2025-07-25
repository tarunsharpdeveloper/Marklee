import express from 'express';
import briefController from '../controllers/briefController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();
// Apply authentication middleware to all routes
router.use(auth);

// Project routes
router.post('/project', briefController.createProject);
router.get('/projects', briefController.getProjectsWithBriefs);
router.put('/project/:id', briefController.updateProject);

// Brief routes
router.post('/create-brief', briefController.createBrief);
router.get('/get-briefs', briefController.getBriefsByProject);
router.get('/get-brief/:id', briefController.getBriefById);
router.put('/update-brief/:id', briefController.updateBrief);
router.get('/get-briefs/:projectId', briefController.getBriefsByProject);

// Audience routes
router.get('/brief/:id/audience', briefController.getAudienceByBrief);
router.post('/brief/:id/audience/delete', briefController.deleteAudiences);

// Content generation routes
router.post('/generate-content', briefController.generateContent);

export default router; 