import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';

const chatModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7
});

// Helper function to clean JSON response
const cleanJsonResponse = (response) => {
    let cleanJson = response.content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    
    try {
        return JSON.parse(cleanJson);
    } catch (error) {
        // If first attempt fails, try to find JSON object within the text
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse JSON response: ' + error.message);
    }
};

class MarketingController {
    // Get AI-generated form fields
    async getFormFields(req, res) {
        try {
            const messages = [
                {
                    role: "system",
                    content: "You are a helpful AI that generates form fields for marketing information gathering. Your response must be a valid JSON object without any markdown formatting or additional text."
                },
                {
                    role: "user",
                    content: `Create a form structure for gathering marketing information. The form must include these exact field names:
- description (What is it?)
- targetMarket (Who benefits most?)
- outcomeBenefit (Outcome/Benefit)
- differentiators (What makes it different?)
- uniqueSellingPoint (Unique Selling Point)

You can add additional optional fields, but these are required.

Include:
1. A welcoming message that is friendly and encouraging
2. Clear guidance for each field to help avoid vague answers
3. A footer message

Additional fields should cover:
- Industry and niche
- Target audience details
- Problems solved
- Key features
- Competitors

Return only a JSON object with this structure:
{
  "welcomeMessage": "A friendly welcome message",
  "fields": [
    {
      "title": "Question title",
      "nameKey": "exactFieldNameFromAbove",
      "placeholder": "Example text",
      "guidance": "Short helpful guidance"
    }
  ],
  "footerMessage": "An encouraging message"
}`
                }
            ];

            const response = await chatModel.invoke(messages);
            const formFields = cleanJsonResponse(response);

            res.status(200).json({
                success: true,
                data: formFields
            });
        } catch (error) {
            console.error('Error generating form fields:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate form fields',
                error: error.message
            });
        }
    }

    // Generate marketing content from form data
    async generateMarketingContent(req, res) {
        try {
            const formData = req.body;

            // Check for missing required fields
            const requiredFields = [
                { key: 'description', label: 'Description (What is it?)' },
                { key: 'targetMarket', label: 'Target Market (Who benefits most?)' },
                { key: 'outcomeBenefit', label: 'Outcome/Benefit' },
                { key: 'differentiators', label: 'Differentiators' },
                { key: 'uniqueSellingPoint', label: 'Unique Selling Point' }
            ];

            const missingFields = requiredFields.filter(field => 
                !formData[field.key] || formData[field.key].trim() === ''
            ).map(field => field.label);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                    data: {
                        coreMessage: `We need a few more details to generate your core message. Please provide: ${missingFields.join(', ')}`,
                        missingFields: missingFields
                    }
                });
            }

            const messages = [
                {
                    role: "system",
                    content: "You are a helpful AI that generates comprehensive marketing strategies. Your response must be a valid JSON object without any markdown formatting or additional text."
                },
                {
                    role: "user",
                    content: `Based on the answers provided in the form, write a clear and compelling core message for the user's company, brand, product, or service. This message should summarise what it is, who it's for, the key benefit or outcome, and what makes it different.

The tone should be clear, confident, and adaptable to different content formats (like websites, ads, or email intros). Aim for one paragraph—no longer than 3 sentences.

Prioritise the following inputs:
- What is it? (Description): ${formData.description}
- Who benefits most? (Primary target market): ${formData.targetMarket}
- What's the outcome or benefit?: ${formData.outcomeBenefit}
- What makes it different from competitors?: ${formData.differentiators}
- What is its unique selling point?: ${formData.uniqueSellingPoint}

Additional context:
- Industry and niche: ${formData.industry || ''} ${formData.nicheCategory || ''}
- Key selling points: ${formData.keyFeatures || 'Not provided'}
- Problem it solves: ${formData.problemSolved || 'Not provided'}

Return only a JSON object with this structure:
{
  "coreMessage": "A clear, compelling core message combining the key information above",
  "valueProposition": "Clear statement of benefits and advantages",
  "keyMarketingPoints": ["Main point 1", "Main point 2"],
  "targetAudiencePersonas": [
    {
      "name": "Persona name",
      "description": "Description",
      "painPoints": ["Pain point 1", "Pain point 2"],
      "goals": ["Goal 1", "Goal 2"]
    }
  ],
  "contentRecommendations": [
    {
      "type": "Content type",
      "description": "Description",
      "purpose": "Purpose"
    }
  ],
  "channelStrategy": [
    {
      "platform": "Platform name",
      "approach": "Approach",
      "expectedOutcome": "Outcome"
    }
  ]
}`
                }
            ];

            const response = await chatModel.invoke(messages);
            const marketingContent = cleanJsonResponse(response);

            res.status(200).json({
                success: true,
                message: 'Marketing content generated successfully',
                data: marketingContent
            });

        } catch (error) {
            console.error('Error generating marketing content:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate marketing content',
                error: error.message
            });
        }
    }
}

export default new MarketingController(); 