const { ProductAnalysisAgent } = require('../utils/productAnalysis');
const dotenv = require('dotenv');

dotenv.config();

const productAnalysisController = {
  async analyzeProduct(req, res) {
    try {
      const {
        productName,
        description,
        priceRange,
        category,
        uniqueFeatures,
        currentMarket
      } = req.body;

      if (!productName) {
        return res.status(400).json({
          success: false,
          message: 'Product name is required'
        });
      }

      const agent = new ProductAnalysisAgent(process.env.OPENAI_API_KEY);
      
      const analysis = await agent.analyzeProduct({
        productName,
        description,
        priceRange,
        category,
        uniqueFeatures,
        currentMarket
      });

      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Product analysis error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error analyzing product'
      });
    }
  },

  async getQuickInsight(req, res) {
    try {
      const { productName, question } = req.body;

      if (!productName || !question) {
        return res.status(400).json({
          success: false,
          message: 'Product name and question are required'
        });
      }

      const agent = new ProductAnalysisAgent(process.env.OPENAI_API_KEY);
      const insight = await agent.getQuickInsight(productName, question);

      res.json({
        success: true,
        insight
      });
    } catch (error) {
      console.error('Quick insight error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting quick insight'
      });
    }
  }
};

module.exports = productAnalysisController; 