const express = require('express');
const router = express.Router();
const productAnalysisController = require('../controllers/productAnalysisController');
const auth = require('../middlewares/auth');

// Route to get full product analysis
router.post('/analyze', productAnalysisController.analyzeProduct);

// Route to get quick insights
router.post('/quick-insight', auth, productAnalysisController.getQuickInsight);

module.exports = router; 