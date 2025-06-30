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
                    content: "You are a helpful AI that generates structured form field data for marketing information gathering. Your response must be a valid JSON object, without any markdown formatting, explanations, or extra text. Follow the exact structure provided."
                },
                {
                    role: "user",
                    content: `Generate a clear, friendly welcome message that invites users to fill out a form. The form helps us gather the essential information needed to generate their messaging and marketing copy. The tone should be helpful and confident.
                    
For each of the following form fields, provide:
- "title": The question to be displayed to the user.
- "nameKey": A machine-friendly key matching the exact field name below.
- "placeholder": A long, very user understandable tip (max 70 words) to help the user give a clear, specific and more understandale for the user. Use simple, non-technical language.
- "guidance": A long, very user understandable tip (max 80 words) to help the user give a clear, specific and more understandale for the user. Use simple, non-technical language.

All fields are required:
1. Description: "What's the name of the company, brand, service, or product you're marketing?" (nameKey: description)
2. Industry: "What industry is it in?" (nameKey: industry)
3. Niche Category: "What niche or category does it fall under?" (nameKey: nicheCategory)
4. Target Market: "Who are you trying to reach?" (nameKey: targetMarket)
5. Core Audience: "Who benefits most from this offering?" (nameKey: coreAudience)
6. Outcome: "What outcome do they get from using it?" (nameKey: outcome)
7. Problem Solved: "What problem does it solve for them?" (nameKey: problemSolved)
8. Website URL: "What's the website URL?" (nameKey: websiteUrl)
9. Competitors: "Who are your main competitors?" (nameKey: competitors)
10. Differentiators: "How is your offering different from competitors?" (nameKey: differentiators)
11. Key Features: "What are its most important features or benefits?" (nameKey: keyFeatures)
12. Unique Offering: "What do you offer that no one else does?" (nameKey: uniqueOffering)
13. Additional Info: "Anything else we should know?" (nameKey: additionalInfo)

Finally, add a short, encouraging footer message to motivate users to complete the form.

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

            // Mark all fields as required
            formFields.fields = formFields.fields.map(field => ({
                ...field,
                required: true
            }));

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
        const isRefresh = req.query.refresh === 'true';
    
        const requiredFields = [
          'description', 'industry', 'nicheCategory', 'targetMarket', 'coreAudience',
          'outcome', 'problemSolved', 'websiteUrl', 'competitors', 'differentiators',
          'keyFeatures', 'uniqueOffering', 'additionalInfo'
        ];
    
        const missingFields = requiredFields.filter(
          (key) => !formData[key] || formData[key].trim() === ''
        );
    
        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields',
            data: {
              coreMessage: `We need a few more details to generate your core message. Please provide: ${missingFields.join(', ')}`,
              missingFields
            }
          });
        }
    
        const basePrompt = `Based on the answers provided in the form, write a clear, compelling, and detailed core message (~100 words) for the user's company, brand, product, or service.
    
    Strictly prioritize these key points:
    - What is it? (Description)
    - Who benefits most? (Core audience or target market)
    - What outcome or benefit does it deliver?
    - What makes it different from competitors?
    - Unique selling point
    
    Use these elements to support the message:
    - Industry and niche
    - Key features and benefits
    - The problem it solves
    - Additional context (if helpful)
    
    The tone should be confident, persuasive, and adaptable for formats like websites, digital ads, and email introductions. Make sure the message flows naturally while clearly communicating the value proposition. Avoid jargon or fluff — keep it focused, practical, and benefit-driven.`;
    
        const refreshPrompt = `Create a new and distinct version of the core message (~100 words), using the same inputs. Present the offering from a different angle or highlight a different major benefit, but still prioritize the following:
    
    - What it is
    - Who it’s for
    - What outcome or benefit it delivers
    - What makes it unique
    - Unique selling point
    
    Use supporting details like niche, features, problems solved, and additional context. Keep it persuasive, clean, and suitable for formats like websites or email.`;
    
        const messages = [
          {
            role: "system",
            content: "You are a helpful AI that generates structured marketing strategies. Your response must be a clean JSON object only. Do not include markdown or extra text."
          },
          {
            role: "user",
            content: `${isRefresh ? refreshPrompt : basePrompt}
    
    Input Data:
    - Description: ${formData.description}
    - Industry: ${formData.industry}
    - Niche Category: ${formData.nicheCategory}
    - Target Market: ${formData.targetMarket}
    - Core Audience: ${formData.coreAudience}
    - Outcome: ${formData.outcome}
    - Problem Solved: ${formData.problemSolved}
    - Website URL: ${formData.websiteUrl}
    - Competitors: ${formData.competitors}
    - Differentiators: ${formData.differentiators}
    - Key Features: ${formData.keyFeatures}
    - Unique Offering: ${formData.uniqueOffering}
    - Additional Info: ${formData.additionalInfo}
    
    Return only a JSON object in this format:
    {
      "coreMessage": "A clear, persuasive message (~130 words), covering the prioritized elements",
      "valueProposition": "Clear statement of benefit and differentiation",
      "keyMarketingPoints": ["Point 1", "Point 2"],
      "targetAudiencePersonas": [
        {
          "name": "Persona name",
          "description": "Brief description",
          "painPoints": ["Pain 1", "Pain 2"],
          "goals": ["Goal 1", "Goal 2"]
        }
      ],
      "contentRecommendations": [
        {
          "type": "Content type",
          "description": "What it’s about",
          "purpose": "Why it’s useful"
        }
      ],
      "channelStrategy": [
        {
          "platform": "Platform name",
          "approach": "Tactic or strategy",
          "expectedOutcome": "Desired result"
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
    
      

    async generateMarketingContentWithPrompt(req, res) {
        try {
            const { formData, currentMessage, userPrompt } = req.body;

            // Validate required fields
            if (!formData || !currentMessage || !userPrompt) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Create a prompt that includes the user's request
            const messages = [
                {
                    role: "system",
                    content: `You are a helpful marketing assistant. The user has a marketing message and wants to improve it. Generate ONE engaging follow-up question in a conversational ChatGPT style.

Current message: "${currentMessage}"
User's request: "${userPrompt}"
Business context: ${JSON.stringify(formData, null, 2)}

Generate ONE question that:
1. Starts with phrases like "Would you like to...", "Should we...", "How about...", or "What if we..."
2. Is specifically related to the content and context
3. Focuses on one aspect that could be improved
4. Sounds natural and conversational, like a ChatGPT suggestion

Example formats:
- "Would you like to make it more specific to [target audience]?"
- "How about emphasizing the [specific benefit] more clearly?"
- "Should we add some concrete examples of [feature/benefit]?"

Return ONLY the question, without any other text or explanations.`
                }
            ];

            const response = await chatModel.invoke(messages);
            
            // Update the core message silently
            const updateMessages = [
                {
                    role: "system",
                    content: `Update this marketing message based on the user's request:
                    
Current message: "${currentMessage}"
User's request: "${userPrompt}"
Business context: ${JSON.stringify(formData, null, 2)}

Return only the updated message, no explanations or additional text.`
                }
            ];
            
            const updateResponse = await chatModel.invoke(updateMessages);

            return res.status(200).json({
                success: true,
                data: {
                    coreMessage: updateResponse.content.trim(),
                    chatResponse: response.content.trim()
                }
            });

        } catch (error) {
            console.error('Error generating marketing content with prompt:', error);
            return res.status(500).json({
                success: false,
                message: 'Error generating marketing content'
            });
        }
    }
}

export default new MarketingController();
