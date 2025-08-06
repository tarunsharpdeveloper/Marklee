import Brand from '../models/Brand.js';
import ToneOfVoice from '../models/ToneOfVoice.js';
import BrandCompliance from '../models/BrandCompliance.js';
import BrandAudience from '../models/BrandAudience.js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

const chatModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7
});

class BrandController {
    // Create a new brand
    async createBrand(req, res) {
        try {
            const { brandName, industry, shortDescription, websiteLink } = req.body;
            
            // Validate required fields
            if (!brandName || !industry || !shortDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name, industry, and short description are required'
                });
            }

            // Check if brand name already exists for this user
            const existingBrand = await Brand.findByName(brandName, req.user.id);
            if (existingBrand) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name already exists'
                });
            }

            const brandId = await Brand.create({
                userId: req.user.id,
                brandName,
                industry,
                shortDescription,
                websiteLink
            });

            const brand = await Brand.findById(brandId);

            res.status(201).json({
                success: true,
                message: 'Brand created successfully',
                data: brand
            });
        } catch (error) {
            console.error('Error creating brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brand',
                error: error.message
            });
        }
    }

    // Get all brands for a user with their projects
    async getBrandsWithProjects(req, res) {
        try {
            const brands = await Brand.findWithProjects(req.user.id);
            
            res.status(200).json({
                success: true,
                data: brands
            });
        } catch (error) {
            console.error('Error fetching brands with projects:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands',
                error: error.message
            });
        }
    }

    // Get a specific brand by ID
    async getBrandById(req, res) {
        try {
            const { id } = req.params;
            const brand = await Brand.findById(id);
            
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Check if brand belongs to user
            if (brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.status(200).json({
                success: true,
                data: brand
            });
        } catch (error) {
            console.error('Error fetching brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand',
                error: error.message
            });
        }
    }

    // Update brand
    async updateBrand(req, res) {
        try {
            const { id } = req.params;
            const { brandName, industry, shortDescription, websiteLink } = req.body;

            const brand = await Brand.findById(id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            if (brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const success = await Brand.update(id, {
                brandName,
                industry,
                shortDescription,
                websiteLink
            });

            if (success) {
                const updatedBrand = await Brand.findById(id);
                res.status(200).json({
                    success: true,
                    message: 'Brand updated successfully',
                    data: updatedBrand
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update brand'
                });
            }
        } catch (error) {
            console.error('Error updating brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update brand',
                error: error.message
            });
        }
    }

    // Delete brand
    async deleteBrand(req, res) {
        try {
            const { id } = req.params;
            
            const brand = await Brand.findById(id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            if (brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const success = await Brand.delete(id);
            
            if (success) {
                res.status(200).json({
                    success: true,
                    message: 'Brand deleted successfully'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to delete brand'
                });
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete brand',
                error: error.message
            });
        }
    }

    // Get marketing archetypes for tone of voice selection
    async getMarketingArchetypes(req, res) {
        try {
            const archetypes = ToneOfVoice.getMarketingArchetypes();
            
            res.status(200).json({
                success: true,
                data: archetypes
            });
        } catch (error) {
            console.error('Error fetching marketing archetypes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch marketing archetypes',
                error: error.message
            });
        }
    }

    // Create or update tone of voice for a brand
    async createToneOfVoice(req, res) {
        try {
            const { brandId, archetype, keyTraits, examples, tips, guidelines } = req.body;

            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check if tone of voice already exists
            const existingTone = await ToneOfVoice.findByBrandId(brandId);
            
            if (existingTone) {
                // Update existing tone of voice
                await ToneOfVoice.update(brandId, {
                    archetype,
                    keyTraits,
                    examples,
                    tips,
                    guidelines
                });
            } else {
                // Create new tone of voice
                await ToneOfVoice.create({
                    brandId,
                    archetype,
                    keyTraits,
                    examples,
                    tips,
                    guidelines
                });
            }

            const updatedTone = await ToneOfVoice.findByBrandId(brandId);

            res.status(200).json({
                success: true,
                message: existingTone ? 'Tone of voice updated successfully' : 'Tone of voice created successfully',
                data: updatedTone
            });
        } catch (error) {
            console.error('Error creating/updating tone of voice:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create/update tone of voice',
                error: error.message
            });
        }
    }

    // Get tone of voice for a brand
    async getToneOfVoice(req, res) {
        try {
            const { brandId } = req.params;
            
            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const toneOfVoice = await ToneOfVoice.findByBrandId(brandId);
            
            res.status(200).json({
                success: true,
                data: toneOfVoice
            });
        } catch (error) {
            console.error('Error fetching tone of voice:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tone of voice',
                error: error.message
            });
        }
    }

    // Create or update brand compliance
    async createBrandCompliance(req, res) {
        try {
            const { 
                brandId, 
                forbiddenWords, 
                requiredPhrases, 
                disclaimers, 
                complianceDocsUrl,
                doList,
                dontList,
                enforceCompliance 
            } = req.body;

            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check if compliance already exists
            const existingCompliance = await BrandCompliance.findByBrandId(brandId);
            
            if (existingCompliance) {
                // Update existing compliance
                await BrandCompliance.update(brandId, {
                    forbiddenWords,
                    requiredPhrases,
                    disclaimers,
                    complianceDocsUrl,
                    doList,
                    dontList,
                    enforceCompliance
                });
            } else {
                // Create new compliance
                await BrandCompliance.create({
                    brandId,
                    forbiddenWords,
                    requiredPhrases,
                    disclaimers,
                    complianceDocsUrl,
                    doList,
                    dontList,
                    enforceCompliance
                });
            }

            const updatedCompliance = await BrandCompliance.findByBrandId(brandId);

            res.status(200).json({
                success: true,
                message: existingCompliance ? 'Brand compliance updated successfully' : 'Brand compliance created successfully',
                data: updatedCompliance
            });
        } catch (error) {
            console.error('Error creating/updating brand compliance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create/update brand compliance',
                error: error.message
            });
        }
    }

    // Get brand compliance
    async getBrandCompliance(req, res) {
        try {
            const { brandId } = req.params;
            
            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const compliance = await BrandCompliance.findByBrandId(brandId);
            
            res.status(200).json({
                success: true,
                data: compliance
            });
        } catch (error) {
            console.error('Error fetching brand compliance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand compliance',
                error: error.message
            });
        }
    }

    // Get compliance presets based on industry
    async getCompliancePresets(req, res) {
        try {
            const { industry } = req.query;
            const preset = BrandCompliance.getCompliancePresets(industry);
            
            res.status(200).json({
                success: true,
                data: preset
            });
        } catch (error) {
            console.error('Error fetching compliance presets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch compliance presets',
                error: error.message
            });
        }
    }

    // Get suggested audiences for a brand
    async getSuggestedAudiences(req, res) {
        try {
            const { brandId } = req.params;
            
            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const suggestedAudiences = await BrandAudience.generateSuggestedAudiences(brand);
            
            res.status(200).json({
                success: true,
                data: suggestedAudiences
            });
        } catch (error) {
            console.error('Error fetching suggested audiences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch suggested audiences',
                error: error.message
            });
        }
    }

    // Generate AI suggestions for brand creation
    async generateAISuggestions(req, res) {
        try {
            const { brandData } = req.body;
            
            if (!brandData || !brandData.brandName || !brandData.industry || !brandData.shortDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name, industry, and description are required'
                });
            }

            // Generate tone of voice suggestions
            const tonePrompt = `Based on the following brand information, suggest an appropriate tone of voice and marketing archetype:

Brand Name: ${brandData.brandName}
Industry: ${brandData.industry}
Description: ${brandData.shortDescription}

Please provide:
1. Recommended marketing archetype (from the 12 archetypes)
2. Key traits for this tone
3. Examples of how to communicate
4. Tips for maintaining this tone

Format as JSON with fields: archetype, keyTraits, examples, tips`;

            const toneResponse = await chatModel.invoke(tonePrompt);
            const toneData = JSON.parse(toneResponse.content);

            // Generate target audience suggestions
            const audiencePrompt = `Based on the following brand information, suggest 3-5 target audience segments:

Brand Name: ${brandData.brandName}
Industry: ${brandData.industry}
Description: ${brandData.shortDescription}

For each audience segment, provide:
1. Audience name
2. Description
3. Key characteristics
4. Why they would be interested in this brand

Format as JSON array with fields: name, description, characteristics, interest`;

            const audienceResponse = await chatModel.invoke(audiencePrompt);
            const audienceData = JSON.parse(audienceResponse.content);

            // Generate compliance suggestions
            const compliancePrompt = `Based on the following brand information, suggest compliance requirements and guidelines:

Brand Name: ${brandData.brandName}
Industry: ${brandData.industry}
Description: ${brandData.shortDescription}

Please provide:
1. Forbidden words/phrases to avoid
2. Required phrases/disclaimers
3. Do's and Don'ts list
4. Any industry-specific compliance requirements

Format as JSON with fields: forbiddenWords, requiredPhrases, doList, dontList, industryRequirements`;

            const complianceResponse = await chatModel.invoke(compliancePrompt);
            const complianceData = JSON.parse(complianceResponse.content);

            res.status(200).json({
                success: true,
                data: {
                    tone: toneData,
                    audiences: audienceData,
                    compliance: complianceData
                }
            });
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate AI suggestions',
                error: error.message
            });
        }
    }

    // Create brand audience
    async createBrandAudience(req, res) {
        try {
            const { brandId, audienceName, audienceDescription, audienceType } = req.body;

            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const audienceId = await BrandAudience.create({
                brandId,
                audienceName,
                audienceDescription,
                audienceType
            });

            const audience = await BrandAudience.findById(audienceId);

            res.status(201).json({
                success: true,
                message: 'Brand audience created successfully',
                data: audience
            });
        } catch (error) {
            console.error('Error creating brand audience:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brand audience',
                error: error.message
            });
        }
    }

    // Get brand audiences
    async getBrandAudiences(req, res) {
        try {
            const { brandId } = req.params;
            
            // Validate brand ownership
            const brand = await Brand.findById(brandId);
            if (!brand || brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const audiences = await BrandAudience.findByBrandId(brandId);
            
            res.status(200).json({
                success: true,
                data: audiences
            });
        } catch (error) {
            console.error('Error fetching brand audiences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand audiences',
                error: error.message
            });
        }
    }

    // Tone of Voice Chat Flow
    async toneOfVoiceChat(req, res) {
        try {
            console.log('Tone of voice chat request received:', req.body);
            const { brandData, currentStep, userAnswer, previousAnswers = [] } = req.body;
            
            if (!brandData || !brandData.brandName || !brandData.industry || !brandData.shortDescription) {
                console.log('Missing brand data:', { brandData });
                return res.status(400).json({
                    success: false,
                    message: 'Brand data is required'
                });
            }

            // If this is the first step, generate the initial question
            if (currentStep === 0) {
                console.log('Generating initial question for brand:', brandData.brandName);
                
                const initialQuestionPrompt = `Based on the following brand information, generate a thoughtful question to help identify the brand's personality and tone of voice. The question should be designed to uncover the brand's core personality traits.

Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

Generate a question along with 3-4 suggested answer options that users can choose from. The question should be conversational and encourage detailed responses. 

Format your response as JSON with this structure:
{
    "question": "Your question here?",
    "suggestions": [
        "Suggestion 1",
        "Suggestion 2", 
        "Suggestion 3",
        "Suggestion 4"
    ]
}

Examples of good questions with suggestions:
- Question: "How would you describe your brand's personality in 3-5 words?"
  Suggestions: ["Friendly and approachable", "Professional and trustworthy", "Innovative and bold", "Reliable and consistent"]

- Question: "What emotions do you want your brand to evoke in your customers?"
  Suggestions: ["Trust and confidence", "Excitement and energy", "Comfort and security", "Inspiration and motivation"]

Make sure the suggestions are relevant to the brand's industry and help guide the user toward understanding their brand personality.`;

                try {
                    console.log('Invoking AI model with prompt...');
                    const questionResponse = await chatModel.invoke(initialQuestionPrompt);
                    console.log('AI model response received');
                    console.log('AI response for initial question:', questionResponse.content);
                    
                    let questionData;
                    try {
                        // Clean the response content to handle markdown code blocks
                        let cleanContent = questionResponse.content.trim();
                        
                        // Remove markdown code blocks if present
                        if (cleanContent.startsWith('```json')) {
                            cleanContent = cleanContent.replace(/^```json\s*/, '');
                        }
                        if (cleanContent.startsWith('```')) {
                            cleanContent = cleanContent.replace(/^```\s*/, '');
                        }
                        if (cleanContent.endsWith('```')) {
                            cleanContent = cleanContent.replace(/\s*```$/, '');
                        }
                        
                        questionData = JSON.parse(cleanContent);
                        console.log('Parsed question data:', questionData);
                    } catch (parseError) {
                        console.error('Error parsing AI response:', parseError);
                        console.error('Raw AI response:', questionResponse.content);
                        
                        // Fallback to a default question if parsing fails
                        questionData = {
                            question: "How would you describe your brand's personality in 3-5 words?",
                            suggestions: [
                                "Friendly and approachable",
                                "Professional and trustworthy", 
                                "Innovative and bold",
                                "Reliable and consistent"
                            ]
                        };
                    }

                    return res.status(200).json({
                        success: true,
                        data: {
                            isComplete: false,
                            nextQuestion: questionData.question,
                            suggestions: questionData.suggestions
                        }
                    });
                } catch (aiError) {
                    console.error('Error invoking AI model:', aiError);
                    
                    // Fallback to a default question if AI fails
                    const questionData = {
                        question: "How would you describe your brand's personality in 3-5 words?",
                        suggestions: [
                            "Friendly and approachable",
                            "Professional and trustworthy", 
                            "Innovative and bold",
                            "Reliable and consistent"
                        ]
                    };

                    return res.status(200).json({
                        success: true,
                        data: {
                            isComplete: false,
                            nextQuestion: questionData.question,
                            suggestions: questionData.suggestions
                        }
                    });
                }
            }

            // If we have enough answers (5 questions), generate the tone of voice
            console.log('Current step:', currentStep, 'Previous answers count:', previousAnswers.length);
            if (currentStep >= 5) {
                // Combine previous answers with the current user answer
                const allAnswers = [...previousAnswers];
                if (userAnswer) {
                    // Add the current user answer as a proper Q&A pair
                    allAnswers.push({ question: "Current question", answer: userAnswer });
                }
                
                const tonePrompt = `Based on the following brand information and user answers, identify the most fitting brand archetypes and create a comprehensive tone of voice:

Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

User Answers:
${allAnswers.map((answer, index) => {
    if (typeof answer === 'object' && answer.answer) {
        return `Question ${index + 1}: ${answer.answer}`;
    } else {
        return `Question ${index + 1}: ${answer}`;
    }
}).join('\n')}

Please analyze the responses and:
1. Identify up to 3 most fitting brand archetypes from the 12 marketing archetypes: The Innocent, The Sage, The Explorer, The Hero, The Outlaw, The Magician, The Regular Guy/Gal, The Lover, The Jester, The Creator, The Ruler, The Caregiver
2. Create a comprehensive tone of voice profile
3. Provide specific guidelines for communication

IMPORTANT: All fields in toneOfVoice must be STRINGS, not objects or arrays.

Format as JSON with fields: 
- archetypes: array of strings (e.g., ["The Innocent", "The Sage"])
- toneOfVoice: object with these STRING fields:
  - keyTraits: string describing key personality traits
  - communicationStyle: string describing how the brand communicates
  - examples: string with example phrases or sentences
  - guidelines: string with communication guidelines

Example format:
{
  "archetypes": ["The Innocent", "The Sage"],
  "toneOfVoice": {
    "keyTraits": "Friendly, trustworthy, and approachable",
    "communicationStyle": "Clear, warm, and professional",
    "examples": "We're here to help you succeed. Our solutions are designed with your needs in mind.",
    "guidelines": "Use warm, encouraging language while maintaining professionalism. Focus on being helpful and supportive."`;

                try {
                    console.log('Generating tone of voice for brand:', brandData.brandName);
                    const toneResponse = await chatModel.invoke(tonePrompt);
                    console.log('AI response for tone generation:', toneResponse.content);
                    
                    let toneData;
                    try {
                        // Clean the response content to handle markdown code blocks
                        let cleanContent = toneResponse.content.trim();
                        
                        // Remove markdown code blocks if present
                        if (cleanContent.startsWith('```json')) {
                            cleanContent = cleanContent.replace(/^```json\s*/, '');
                        }
                        if (cleanContent.startsWith('```')) {
                            cleanContent = cleanContent.replace(/^```\s*/, '');
                        }
                        if (cleanContent.endsWith('```')) {
                            cleanContent = cleanContent.replace(/\s*```$/, '');
                        }
                        
                        toneData = JSON.parse(cleanContent);
                        console.log('Parsed tone data:', toneData);
                        console.log('Archetypes in parsed data:', toneData.archetypes);
                        console.log('ToneOfVoice in parsed data:', toneData.toneOfVoice);
                        
                        // Validate and ensure all toneOfVoice fields are strings
                        if (toneData.toneOfVoice) {
                            const requiredFields = ['keyTraits', 'communicationStyle', 'examples', 'guidelines'];
                            requiredFields.forEach(field => {
                                if (toneData.toneOfVoice[field] && typeof toneData.toneOfVoice[field] !== 'string') {
                                    console.log(`Converting ${field} from ${typeof toneData.toneOfVoice[field]} to string`);
                                    toneData.toneOfVoice[field] = JSON.stringify(toneData.toneOfVoice[field]);
                                }
                            });
                        }
                    } catch (parseError) {
                        console.error('Error parsing tone response:', parseError);
                        console.error('Raw tone response:', toneResponse.content);
                        
                        // Fallback to default tone data if parsing fails
                        toneData = {
                            archetypes: ["The Innocent", "The Sage"],
                            toneOfVoice: {
                                keyTraits: "Professional and trustworthy",
                                communicationStyle: "Clear and direct",
                                examples: "We deliver reliable solutions",
                                guidelines: "Maintain a professional tone while being approachable"
                            }
                        };
                        console.log('Using fallback tone data:', toneData);
                        
                        // Ensure all fields are strings in fallback data too
                        if (toneData.toneOfVoice) {
                            const requiredFields = ['keyTraits', 'communicationStyle', 'examples', 'guidelines'];
                            requiredFields.forEach(field => {
                                if (toneData.toneOfVoice[field] && typeof toneData.toneOfVoice[field] !== 'string') {
                                    console.log(`Converting fallback ${field} from ${typeof toneData.toneOfVoice[field]} to string`);
                                    toneData.toneOfVoice[field] = JSON.stringify(toneData.toneOfVoice[field]);
                                }
                            });
                        }
                    }

                    console.log('Sending complete response with archetypes:', toneData.archetypes);
                    console.log('Sending complete response with toneOfVoice:', toneData.toneOfVoice);
                    console.log('Archetypes type:', typeof toneData.archetypes);
                    console.log('Archetypes is array:', Array.isArray(toneData.archetypes));
                    console.log('Full response data being sent:', {
                        success: true,
                        data: {
                            isComplete: true,
                            archetypes: toneData.archetypes || [],
                            toneOfVoice: toneData.toneOfVoice || {}
                        }
                    });
                    return res.status(200).json({
                        success: true,
                        data: {
                            isComplete: true,
                            archetypes: toneData.archetypes || [],
                            toneOfVoice: toneData.toneOfVoice || {}
                        }
                    });
                } catch (aiError) {
                    console.error('Error generating tone of voice:', aiError);
                    
                    // Fallback to default tone data if AI fails
                    const toneData = {
                        archetypes: ["The Innocent", "The Sage"],
                        toneOfVoice: {
                            keyTraits: "Professional and trustworthy",
                            communicationStyle: "Clear and direct",
                            examples: "We deliver reliable solutions",
                            guidelines: "Maintain a professional tone while being approachable"
                        }
                    };
                    console.log('Using AI fallback tone data:', toneData);
                    
                    // Ensure all fields are strings in AI fallback data too
                    if (toneData.toneOfVoice) {
                        const requiredFields = ['keyTraits', 'communicationStyle', 'examples', 'guidelines'];
                        requiredFields.forEach(field => {
                            if (toneData.toneOfVoice[field] && typeof toneData.toneOfVoice[field] !== 'string') {
                                console.log(`Converting AI fallback ${field} from ${typeof toneData.toneOfVoice[field]} to string`);
                                toneData.toneOfVoice[field] = JSON.stringify(toneData.toneOfVoice[field]);
                            }
                        });
                    }

                    console.log('Sending fallback response with archetypes:', toneData.archetypes);
                    console.log('Fallback archetypes type:', typeof toneData.archetypes);
                    console.log('Fallback archetypes is array:', Array.isArray(toneData.archetypes));
                    return res.status(200).json({
                        success: true,
                        data: {
                            isComplete: true,
                            archetypes: toneData.archetypes || [],
                            toneOfVoice: toneData.toneOfVoice || {}
                        }
                    });
                }
            }

                           // Generate the next contextual question based on previous answers
               const contextualQuestionPrompt = `Based on the following brand information and previous answers, generate the next question to help identify the brand's personality and tone of voice.
               
               Brand Information:
               - Name: ${brandData.brandName}
               - Industry: ${brandData.industry}
               - Description: ${brandData.shortDescription}
               
               Previous Questions and Answers:
               ${previousAnswers.map((qa, index) => `Q${index + 1}: ${qa.question} | A${index + 1}: ${qa.answer}`).join('\n')}
               
               PREVIOUS QUESTIONS ASKED (DO NOT repeat any of these):
               ${previousAnswers.map((qa, index) => `${index + 1}. ${qa.question}`).join('\n')}
               
               Current Step: ${currentStep + 1} of 5
               
               Generate a thoughtful, contextual question that builds upon the previous answers and helps uncover different aspects of the brand's personality. 
               
               CRITICAL REQUIREMENTS:
               1. DO NOT repeat any of the already asked questions listed above
               2. The new question must be completely different from all previously asked questions
               3. The question should be:
                  - Relevant to the brand's industry and previous responses
                  - Designed to uncover personality traits not yet explored
                  - Conversational and encouraging detailed responses
                  - Focused on understanding the brand's communication style, values, or emotional impact
                  - Completely unique and different from the already asked questions
               
               Also provide 3-4 suggested answer options that users can choose from, based on the context of previous answers and the brand's industry.
               
               Format your response as JSON with this structure:
               {
                   "question": "Your contextual question here?",
                   "suggestions": [
                       "Suggestion 1",
                       "Suggestion 2", 
                       "Suggestion 3",
                       "Suggestion 4"
                   ]
               }
               
               Examples of contextual questions with suggestions:
               - Question: "How does your brand want to be perceived by competitors?"
                 Suggestions: ["As an industry leader", "As an innovative challenger", "As a trusted expert", "As a reliable partner"]
               
               - Question: "What tone do you use when addressing customer concerns?"
                 Suggestions: ["Empathetic and understanding", "Professional and solution-focused", "Friendly and reassuring", "Direct and efficient"]
               
               Make sure the suggestions are contextual to the previous answers and help guide the user toward a comprehensive understanding of their brand personality.`;

                    try {
            console.log('Generating contextual question for step:', currentStep + 1);
            console.log('Previous Q&A pairs:', previousAnswers);
            const questionResponse = await chatModel.invoke(contextualQuestionPrompt);
            console.log('AI response for contextual question:', questionResponse.content);
            
            let questionData;
            try {
                // Clean the response content to handle markdown code blocks
                let cleanContent = questionResponse.content.trim();
                
                // Remove markdown code blocks if present
                if (cleanContent.startsWith('```json')) {
                    cleanContent = cleanContent.replace(/^```json\s*/, '');
                }
                if (cleanContent.startsWith('```')) {
                    cleanContent = cleanContent.replace(/^```\s*/, '');
                }
                if (cleanContent.endsWith('```')) {
                    cleanContent = cleanContent.replace(/\s*```$/, '');
                }
                
                questionData = JSON.parse(cleanContent);
                console.log('Parsed contextual question data:', questionData);
                
                // Check if the generated question is already in previous questions
                const previousQuestions = previousAnswers.map(qa => qa.question);
                if (previousQuestions.includes(questionData.question)) {
                    console.log('AI generated a repeated question:', questionData.question);
                    console.log('Previous questions so far:', previousQuestions);
                    console.log('Using fallback question');
                    
                    // List of fallback questions to choose from
                    const fallbackQuestions = [
                        "What tone do you use when addressing customer concerns?",
                        "How does your brand want to be perceived by competitors?",
                        "What emotions do you want your brand to evoke in your customers?",
                        "How would you describe your brand's communication style?",
                        "What values does your brand want to convey?",
                        "How does your brand handle difficult situations?",
                        "What personality traits best describe your brand?",
                        "How does your brand want to be remembered?",
                        "What makes your brand unique in your industry?",
                        "How does your brand approach problem-solving?"
                    ];
                    
                    // Find a question that hasn't been asked yet
                    const availableQuestion = fallbackQuestions.find(q => !previousQuestions.includes(q));
                    
                    questionData = {
                        question: availableQuestion || "What tone do you use when addressing customer concerns?",
                        suggestions: [
                            "Empathetic and understanding",
                            "Professional and solution-focused",
                            "Friendly and reassuring",
                            "Direct and efficient"
                        ]
                    };
                }
            } catch (parseError) {
                console.error('Error parsing contextual question response:', parseError);
                console.error('Raw contextual question response:', questionResponse.content);
                
                // Fallback to a default contextual question if parsing fails
                questionData = {
                    question: "What tone do you use when addressing customer concerns?",
                    suggestions: [
                        "Empathetic and understanding",
                        "Professional and solution-focused",
                        "Friendly and reassuring",
                        "Direct and efficient"
                    ]
                };
            }
                
                res.status(200).json({
                    success: true,
                    data: {
                        isComplete: false,
                        nextQuestion: questionData.question,
                        suggestions: questionData.suggestions
                    }
                });
            } catch (aiError) {
                console.error('Error generating contextual question:', aiError);
                
                // Fallback to a default contextual question if AI fails
                const questionData = {
                    question: "What tone do you use when addressing customer concerns?",
                    suggestions: [
                        "Empathetic and understanding",
                        "Professional and solution-focused",
                        "Friendly and reassuring",
                        "Direct and efficient"
                    ]
                };
                
                res.status(200).json({
                    success: true,
                    data: {
                        isComplete: false,
                        nextQuestion: questionData.question,
                        suggestions: questionData.suggestions
                    }
                });
            }
        } catch (error) {
            console.error('Error in tone of voice chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process tone of voice chat',
                error: error.message
            });
        }
    }
}

export default new BrandController(); 