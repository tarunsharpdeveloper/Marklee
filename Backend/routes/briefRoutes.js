const express = require('express');
const router = express.Router();
const briefController = require('../controllers/briefController');
const auth = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Project routes
router.post('/project', briefController.createProject);
router.get('/projects', briefController.getProjectsWithBriefs);

// Brief routes
router.post('/create-brief', briefController.createBrief);
router.get('/get-briefs', briefController.getBriefsByProject);
router.get('/get-brief/:id', briefController.getBriefById);
router.put('/update-brief/:id', briefController.updateBrief);
router.get('/get-briefs/:projectId', briefController.getBriefsByProject);

// Audience routes
router.post('/brief/:id/audience', briefController.createAudience);

// Content generation routes
router.post('/generate-content', briefController.generateContent);

module.exports = router; 