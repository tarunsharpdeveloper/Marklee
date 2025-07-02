import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import AiPrompt from '../models/AiPrompt.js';
import Brief from '../models/Brief.js';
import Audience from '../models/Audience.js';

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
            // Fetch the business form prompt from database (type id 3)
            const businessFormPrompts = await AiPrompt.getPromptFor(3);
            if (!businessFormPrompts || businessFormPrompts.length === 0) {
                throw new Error('Business form prompt not found');
            }
            const formPrompt = businessFormPrompts[0].prompt;

            const messages = [
                {
                    role: "system",
                    content: "You are a helpful AI that generates structured form field data for marketing information gathering. Your response must be a valid JSON object, without any markdown formatting, explanations, or extra text. Follow the exact structure provided."
                },
                {
                    role: "user",
                    content: formPrompt
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
        const isModification = formData.currentMessage && formData.modificationRequest;
    
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

        // Fetch the core message prompt from database (type id 4)
        const coreMessagePrompts = await AiPrompt.getPromptFor(4);
        if (!coreMessagePrompts || coreMessagePrompts.length === 0) {
            throw new Error('Core message prompt not found');
        }
        const basePrompt = coreMessagePrompts[0].prompt;

        let prompt;
        if (isModification) {
          prompt = `Modify this existing core message according to the specific request. Keep the essence and key information while applying the requested changes.

Current Message:
${formData.currentMessage}

Modification Request:
${formData.modificationRequest}

Use these supporting details to ensure accuracy:
- Description: ${formData.description}
- Industry: ${formData.industry}
- Target Market: ${formData.targetMarket}
- Core Audience: ${formData.coreAudience}
- Key Features: ${formData.keyFeatures}
- Unique Offering: ${formData.uniqueOffering}

Return a modified version that maintains accuracy while fulfilling the modification request. Keep it clear, compelling, and suitable for marketing use.`;
        } else if (isRefresh) {
          prompt = `Create a new and distinct version of the core message (~100 words), using the same inputs. Present the offering from a different angle or highlight a different major benefit, but still follow this guidance:

${basePrompt}`;
        } else {
          prompt = basePrompt;
        }
    
        const messages = [
          {
            role: "system",
            content: "You are a helpful AI that generates structured marketing strategies. Your response must be a clean JSON object only. Do not include markdown or extra text."
          },
          {
            role: "user",
            content: `${prompt}

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
          "description": "What it's about",
          "purpose": "Why it's useful"
        }
      ],
      "channelStrategy": []
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

    async generateFromAudience(req, res) {
        try {
            const { labelName, whoTheyAre, whatTheyWant, whatTheyStruggle, additionalInfo, projectId, projectName } = req.body;

            // Validate required fields
            if (!labelName || !whoTheyAre || !whatTheyWant) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required audience information'
                });
            }

            // Validate project information
            if (!projectId || !projectName) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing project information. Please select a project first.'
                });
            }

            const messages = [
                {
                    role: "system",
                    content: `You are a messaging strategist helping the user define and refine their Target Audiences. The user has written a basic audience profile.

Your goal is to help them:
- Clarify or rewrite the summary
- Add useful details (like pain points, desires, behaviours, channels)
- Adjust the tone or specificity to match their style or industry
- Explore alternate ways to frame or describe the same persona

Always offer 1–2 revised versions based on their input. Be collaborative and encouraging. When they're satisfied, offer to save the final version.

Return a JSON object with this structure:
{
    "coreMessage": "Primary Version:\\n[The refined version]\\n\\nAlternative Perspective:\\n[The alternative framing]\\n\\nKey Details:\\n• Pain Points:\\n[List of pain points]\\n\\n• Desires:\\n[List of desires]\\n\\n• Behaviors:\\n[List of behaviors]\\n\\n• Channels:\\n[List of channels]",
    "chatResponse": "A collaborative question to help further refine the description",
    "insights": ["Key insight 1", "Key insight 2"],
    "messagingAngle": "How to position the offering for this audience",
    "tone": "Appropriate tone for this audience",
    "supportPoints": ["Support point 1", "Support point 2"]
}`
                },
                {
                    role: "user",
                    content: `Please analyze and enhance this audience profile:

Audience Name/Label: ${labelName}
Who They Are: ${whoTheyAre}
What They Want: ${whatTheyWant}
Their Struggles: ${whatTheyStruggle || 'Not specified'}
Additional Context: ${additionalInfo || 'Not provided'}

Generate a refined audience description with enhanced details and an alternative framing.`
                }
            ];

            const response = await chatModel.invoke(messages);
            const parsedResponse = JSON.parse(response.content);

            // Create a new brief
            const briefResult = await Brief.create({
                projectId,
                projectName,
                purpose: whoTheyAre,
                mainMessage: whatTheyWant,
                specialFeatures: '',
                beneficiaries: labelName,
                benefits: whatTheyStruggle || '',
                callToAction: '',
                importance: '',
                additionalInfo: additionalInfo || ''
            });

            // Create the audience
            const audienceData = [{
                briefId: briefResult,
                segment: JSON.stringify({
                    name: labelName,
                    description: whoTheyAre
                }),
                insights: JSON.stringify(parsedResponse.insights || []),
                messagingAngle: parsedResponse.messagingAngle || '',
                supportPoints: JSON.stringify(parsedResponse.supportPoints || []),
                tone: parsedResponse.tone || '',
                personaProfile: JSON.stringify({
                    whoTheyAre,
                    whatTheyWant,
                    whatTheyStruggle: whatTheyStruggle || '',
                    additionalInfo: additionalInfo || ''
                })
            }];

            const audienceResult = await Audience.create(audienceData);
            
            // Fetch the created brief and audience for response
            const brief = await Brief.findById(briefResult);
            const audiences = await Audience.findByBriefId(briefResult);
            
            return res.status(200).json({
                success: true,
                data: {
                    coreMessage: parsedResponse.coreMessage,
                    chatResponse: parsedResponse.chatResponse,
                    brief,
                    audience: audiences[0]
                }
            });

        } catch (error) {
            console.error('Error generating message from audience:', error);
            return res.status(500).json({
                success: false,
                message: 'Error generating message',
                error: error.message
            });
        }
    }

    async generateSuggestedAudiences(req, res) {
        try {
            const { description, whoItHelps, problemItSolves, projectId, projectName } = req.body;

            // Validate required fields
            if (!description || !whoItHelps || !problemItSolves) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: description, whoItHelps, or problemItSolves'
                });
            }

            // Validate project information
            if (!projectId || !projectName) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing project information. Please select a project first.'
                });
            }

            const messages = [
                {
                    role: "system",
                    content: `Based on the user's input, generate a list of 3–5 clearly defined target audiences who are likely to benefit from their product, service, or brand.

Each audience should include:
- A short name or label (e.g. "Solo coaches scaling their practice")
- A 1–2 sentence summary describing who they are, what they care about, and why this offering is relevant to them.

Keep outputs diverse in sector, job type, or context (e.g. solopreneurs, mid-sized ops teams, buyers, community-driven users, etc.).

When this prompt is used again to regenerate new audience options, do not repeat any of the previously returned audiences. Return fresh options based on different possible market angles or overlooked personas.

Return a JSON object with this structure:
{
    "audiences": [
        {
            "name": "Audience name/label",
            "description": "1-2 sentence summary",
            "insights": ["Key insight 1", "Key insight 2"],
            "messagingAngle": "How to position the offering for this audience",
            "tone": "Appropriate tone for this audience"
        }
    ]
}`
                },
                {
                    role: "user",
                    content: `Generate audience segments based on this information:

Description of the offering: ${description}
Who it helps: ${whoItHelps}
Problem it solves: ${problemItSolves}`
                }
            ];

            const response = await chatModel.invoke(messages);
            
            // Clean the response by removing markdown formatting
            const cleanResponse = response.content
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
                
            const parsedResponse = JSON.parse(cleanResponse);

            // Create a new brief
            const briefResult = await Brief.create({
                projectId,
                projectName,
                purpose: description,
                mainMessage: whoItHelps,
                specialFeatures: '',
                beneficiaries: whoItHelps,
                benefits: problemItSolves,
                callToAction: '',
                importance: '',
                additionalInfo: ''
            });

            // Create audiences
            const audienceData = parsedResponse.audiences.map(audience => ({
                briefId: briefResult,
                segment: JSON.stringify({
                    name: audience.name,
                    description: audience.description
                }),
                insights: JSON.stringify(audience.insights || []),
                messagingAngle: audience.messagingAngle || '',
                supportPoints: JSON.stringify([]),
                tone: audience.tone || '',
                personaProfile: JSON.stringify({
                    description,
                    whoItHelps,
                    problemItSolves
                })
            }));

            await Audience.create(audienceData);
            
            // Fetch the created brief and audiences for response
            const brief = await Brief.findById(briefResult);
            const audiences = await Audience.findByBriefId(briefResult);
            
            // Transform the audiences for frontend
            const formattedAudiences = audiences.map(audience => ({
                id: audience.id,
                name: JSON.parse(audience.segment).name,
                description: JSON.parse(audience.segment).description,
                segment: audience.segment,
                insights: audience.insights,
                messagingAngle: audience.messagingAngle,
                tone: audience.tone
            }));

            return res.status(200).json({
                success: true,
                data: {
                    audiences: formattedAudiences,
                    brief
                }
            });

        } catch (error) {
            console.error('Error generating suggested audiences:', error);
            return res.status(500).json({
                success: false,
                message: 'Error generating suggested audiences',
                error: error.message
            });
        }
    }
}

export default new MarketingController();
