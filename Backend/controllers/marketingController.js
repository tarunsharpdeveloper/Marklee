import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import AiPrompt from '../models/AiPrompt.js';
import Brief from '../models/Brief.js';
import Audience from '../models/Audience.js';
import { pool as db } from '../config/database.js';

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
                    content: "Generate a marketing form structure quickly. Return a JSON object only, no explanations needed."
                },
                {
                    role: "user",
                    content: formPrompt
                }
            ];

            // Use lower temperature for faster, more focused response
            const response = await chatModel.invoke(messages, {
                temperature: 0.3
            });
            
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
    
        // Update required fields to match frontend
        const requiredFields = [
          'description',
          'productSummary',
          'coreAudience',
          'outcome'
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
            prompt = `You're an AI messaging assistant. The user has just provided a specific request to refine their existing Core Message. Modify the message according to their input while keeping its original meaning and purpose.
          
          Current Message:
          ${formData.currentMessage}
          
          Modification Request:
          ${formData.modificationRequest}
          
          Use these supporting details to ensure accuracy:
          - Description: ${formData.description}
          - Product Summary: ${formData.productSummary}
          - Core Audience: ${formData.coreAudience}
          - Outcome: ${formData.outcome}
          ${formData.industry ? `- Industry: ${formData.industry}` : ''}
          ${formData.targetMarket ? `- Target Market: ${formData.targetMarket}` : ''}
          ${formData.keyFeatures ? `- Key Features: ${formData.keyFeatures}` : ''}
          ${formData.uniqueOffering ? `- Unique Offering: ${formData.uniqueOffering}` : ''}
          
          Return only the **revised Core Message** (max 3 sentences). Make sure it is clear, compelling, strategic, and marketing-ready.`;
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

    Required Input Data:
    - Description: ${formData.description}
    - Product Summary: ${formData.productSummary}
    - Core Audience: ${formData.coreAudience}
    - Outcome: ${formData.outcome}

    Additional Information (if provided):
    ${formData.industry ? `- Industry: ${formData.industry}` : ''}
    ${formData.nicheCategory ? `- Niche Category: ${formData.nicheCategory}` : ''}
    ${formData.targetMarket ? `- Target Market: ${formData.targetMarket}` : ''}
    ${formData.problemSolved ? `- Problem Solved: ${formData.problemSolved}` : ''}
    ${formData.websiteUrl ? `- Website URL: ${formData.websiteUrl}` : ''}
    ${formData.competitors ? `- Competitors: ${formData.competitors}` : ''}
    ${formData.differentiators ? `- Differentiators: ${formData.differentiators}` : ''}
    ${formData.keyFeatures ? `- Key Features: ${formData.keyFeatures}` : ''}
    ${formData.uniqueOffering ? `- Unique Offering: ${formData.uniqueOffering}` : ''}
    ${formData.additionalInfo ? `- Additional Info: ${formData.additionalInfo}` : ''}

    Avoid using emojis or decorative symbols
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
            const { formData, currentMessage, userPrompt, isAudienceEdit } = req.body;

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
                    content: isAudienceEdit ? 
                    `You are a concise marketing assistant specializing in audience analysis. Help refine their audience description.

Current audience: "${currentMessage}"
User request: "${userPrompt}"
Context: ${JSON.stringify(formData, null, 2)}

Provide a brief response that:
1. Directly answers the user's request in 2-3 sentences
2. Suggests ONE specific improvement that hasn't been mentioned before
3. Uses a friendly, professional tone
4. Keeps total response under 70 words
5. Must provide a different suggestion each time
6. Never repeat previous suggestions or advice
7. Focus on a new aspect of the audience each time (e.g., demographics, psychographics, behavior, needs, pain points, job roles, industry verticals)

Return ONLY your response, no formatting.` :
                    `You are a concise marketing assistant. The user has a marketing message they want to improve.

Current message: "${currentMessage}"
User request: "${userPrompt}"

Provide a brief response that:
1. Directly addresses their request in 2 sentences
2. Suggests ONE specific improvement
3. Uses a friendly, professional tone
4. Keeps total response under 20 words
5. Question not get repeated

Return ONLY your response, no formatting.`
                }
            ];

            const response = await chatModel.invoke(messages);
            
            // Update the core message silently
            const updateMessages = [
                {
                    role: "system",
                    content: isAudienceEdit ?
                    `Update this audience description based on the user's request:
                    
Current description: "${currentMessage}"
User's request: "${userPrompt}"
Audience context: ${JSON.stringify(formData, null, 2)}

Return only the updated audience description, focusing on:
1. Clear identification of who the audience is
2. Their key characteristics and behaviors
3. Pain points and desires
4. Relevant demographic or firmographic details
5. Any unique insights that make this audience distinct

Keep the description concise but comprehensive. No explanations or additional text.` :
                    `Update this marketing message based on the user's request:
                    
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

Each audience should be described in a clear, detailed paragraph that includes:
- Who they are
- What they care about
- Why this offering is relevant to them
- Their key pain points and desires

Keep outputs diverse in sector, job type, or context (e.g. solopreneurs, mid-sized ops teams, buyers, community-driven users, etc.).

When this prompt is used again to regenerate new audience options, do not repeat any of the previously returned audiences. Return fresh options based on different possible market angles or overlooked personas.

IMPORTANT: For each audience segment, format the "segment" field as follows:
- Start with exactly 2 words that form a complete, logical title (e.g., "Young Tech Professionals", "Small Business Owners", "Health-Conscious Parents", "Active Sports Families", "Busy Working Parents", "Creative Entrepreneurs")
- The 2 words must form a complete phrase that makes sense on its own
- Follow immediately with a space and then a full descriptive paragraph about the audience
- Example: "Young Tech Professionals These individuals are typically aged 25-35, working in technology companies or startups, and are early adopters of new digital solutions. They value efficiency, innovation, and seamless user experiences. They often struggle with work-life balance and are constantly seeking tools that can streamline their daily tasks and improve productivity."

CRITICAL RULES:
1. The first 2 words must be a complete, logical title that makes sense on its own. 
   - AVOID: Incomplete phrases like "Active Parents of" or "Dedicated Coaches and"
   - USE: Complete phrases like "Active Sports Parents", "Dedicated Sports Coaches", "Busy Working Parents"
   - The title must NOT end with words like "and", "of", "the", "in", "to", "for", "with"
   - The title must be a complete noun phrase that can stand alone
2. The description paragraph must NOT start with the same words as the title. For example:
   - WRONG: "Active Sports Families Active sports families consist of..."
   - CORRECT: "Active Sports Families These families typically consist of..." or "Active Sports Families Parents with children who participate in..."

Return a JSON object with this structure:
{
    "audiences": [
        {
            "segment": "Complete 2 Word Title Full descriptive paragraph about the audience including who they are, what they care about, why this offering is relevant to them, and their key pain points and desires.",
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

            // Create audiences with plain text segments
            const audienceData = parsedResponse.audiences.map(audience => ({
                briefId: briefResult,
                segment: audience.segment, // Store segment directly as text
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

            return res.status(200).json({
                success: true,
                data: {
                    audiences,
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

    // Update audience
    async updateAudience(req, res) {
        try {
            const { id } = req.params;
            const { segment } = req.body;

            // Validate input
            if (!segment || typeof segment !== 'string') {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid segment data' 
                });
            }

            // First find the audience to update
            const audience = await Audience.findById(id);
            if (!audience) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Audience not found' 
                });
            }

            // Update the segment data directly as string
            const [result] = await db.execute(
                `UPDATE audiences 
                 SET segment = ?, 
                     updated_at = NOW() 
                 WHERE id = ?`,
                [segment, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Failed to update audience' 
                });
            }

            // Get the updated audience
            const updatedAudience = await Audience.findById(id);
            
            res.json({ 
                success: true,
                data: updatedAudience 
            });
        } catch (error) {
            console.error('Error updating audience:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error' 
            });
        }
    }
}

export default new MarketingController();
