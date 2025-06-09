const express = require('express');
const router = express.Router();
const briefController = require('../controllers/briefController');
const auth = require('../middlewares/auth');

// Apply authentication middleware to all routes
// router.use(auth);

// Project routes
router.post('/project', briefController.createProject);
router.get('/projects', briefController.getProjects);

// Brief routes
router.post('/:projectName/brief', briefController.createBrief);
router.get('/:projectName/briefs', briefController.getBriefsByProject);
router.get('/brief/:id', briefController.getBriefById);
router.put('/brief/:id', briefController.updateBrief);

// Audience routes
router.post('/brief/:id/audience', briefController.createAudience);

// Content generation routes
router.post('/generate-content', briefController.generateContent);

module.exports = router; 