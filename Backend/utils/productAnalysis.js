const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { BaseOutputParser } = require("@langchain/core/output_parsers");

class ProductAnalysisOutputParser extends BaseOutputParser {
  constructor() {
    super();
    this.lc_namespace = ["custom", "output_parsers"];
  }

  async parse(text) {
    const sections = text.split(/\d+\.\s+/).filter(Boolean);
    
    return {
      targetAudience: this.extractSection(sections, 0) || "Analysis not available",
      marketPositioning: this.extractSection(sections, 1) || "Analysis not available", 
      marketingChannels: this.extractSection(sections, 2) || "Analysis not available",
      keyMessaging: this.extractSection(sections, 3) || "Analysis not available",
      competitiveLandscape: this.extractSection(sections, 4) || "Analysis not available",
      growthOpportunities: this.extractSection(sections, 5) || "Analysis not available",
      budgetAllocation: this.extractSection(sections, 6) || "Analysis not available",
      successMetrics: this.extractSection(sections, 7) || "Analysis not available"
    };
  }

  extractSection(sections, index) {
    if (index >= sections.length) return "";
    return sections[index].trim();
  }

  getFormatInstructions() {
    return "Please format the response with numbered sections starting from 1.";
  }
}

class ProductAnalysisAgent {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      openAIApiKey: apiKey,
      temperature: 0.7
    });
  }

  async analyzeProduct(productData) {
    const prompt = PromptTemplate.fromTemplate(`
As a marketing expert, analyze the product "{productName}" and provide comprehensive marketing insights. Please structure your response with clear numbered sections:

Product Details:
- Name: {productName}
- Description: {description}
- Price Range: {priceRange}
- Category: {category}
- Unique Features: {uniqueFeatures}
- Current Market: {currentMarket}

Please provide a detailed analysis with the following structure:

1. Target Audience Analysis
• Primary demographics (age, gender, income level)
• Psychographic profiles (lifestyle, values, interests)
• Behavioral patterns and preferences
• Pain points this product addresses

2. Market Positioning Strategy
• Optimal market position
• Key differentiators
• Brand personality recommendations
• Competitive advantages to highlight

3. Marketing Channel Recommendations
• Most effective digital channels
• Traditional marketing opportunities
• Content marketing strategies
• Social media platform priorities

4. Key Messaging Framework
• Core value proposition
• Primary messaging pillars
• Emotional triggers to leverage
• Call-to-action recommendations

5. Competitive Landscape Insights
• Main competitors analysis
• Market gaps and opportunities
• Competitive advantages
• Threats to address

6. Growth Opportunities
• Market expansion possibilities
• Product line extension ideas
• Partnership opportunities
• New customer segments

7. Budget Allocation Suggestions
• Recommended marketing mix
• Channel investment priorities
• Expected ROI considerations
• Testing and optimization areas

8. Success Metrics
• Key performance indicators
• Tracking methods
• Success benchmarks
• Optimization opportunities

Format each section clearly with bullet points and actionable insights.
    `);

    try {
      const result = await this.llm.invoke(await prompt.format({
        productName: productData.productName,
        description: productData.description || 'Not specified',
        priceRange: productData.priceRange || 'Not specified',
        category: productData.category || 'Not specified',
        uniqueFeatures: productData.uniqueFeatures || 'Not specified',
        currentMarket: productData.currentMarket || 'Not specified'
      }));
      
      const parser = new ProductAnalysisOutputParser();
      return parser.parse(result.text);
    } catch (error) {
      console.error('Error in product analysis:', error);
      throw new Error('Failed to analyze product. Please check your API key and try again.');
    }
  }

  async getQuickInsight(productName, question) {
    const quickPrompt = PromptTemplate.fromTemplate(`
As a marketing expert, provide a quick insight about the product "{productName}" regarding this question: {question}

Keep your response concise but actionable, focusing on practical marketing advice.
    `);

    try {
      const result = await this.llm.invoke(await quickPrompt.format({
        productName,
        question
      }));
      
      return result.text;
    } catch (error) {
      console.error('Error getting quick insight:', error);
      throw new Error('Failed to get insight. Please try again.');
    }
  }
}

module.exports = {
  ProductAnalysisAgent,
  ProductAnalysisOutputParser
}; 