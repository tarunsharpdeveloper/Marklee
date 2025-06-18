import Brief from '../models/Brief.js';
import Audience from '../models/Audience.js';
import Project from '../models/Project.js';
import GeneratedContent from '../models/GeneratedContent.js';
import UserMetadata from '../models/UserMetadata.js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Error handling utility
const handleError = (res, error, message = 'Operation failed') => {
    console.error(`${message}:`, error);
    res.status(500).json({
        success: false,
        message,
        error: error.message
    });
};

// Initialize ChatOpenAI
const chatModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7
});

class BriefController {

    async createProject(req, res) {
        try {
            const projectExists = await Project.findByName(req.body?.projectName?.trim(), req.user.id);
            if (projectExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Project already exists'
                });
            }
            const projectId = await Project.create(req.body);
            const project = await Project.findById(projectId);
            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: project
            });
        }
        catch (error) {
            handleError(res, error, 'Failed to create project');
        }
    }

    // Get Projects
    async getProjectsWithBriefs(req, res) {
        try {
            const projects = await Project.findByUserWithBriefs(req.user.id);
            res.status(200).json({
                success: true,
                data: projects
            });
        } catch (error) {
            handleError(res, error, 'Error fetching projects');
        }
    }

    // Create Brief
    async createBrief(req, res) {
        try {
            const briefId = await Brief.create(req.body);
            
            // Generate audiences using the controller's function
            const audiences = await BriefController.prototype.generateAudienceSegments(briefId, req.user.id);
            if (audiences.success) {
            res.status(201).json({
                success: true,
                message: 'Brief created successfully',
                data: audiences?.data,
                })
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Something went wrong',
                    error: audiences?.error
                });
            }
        } catch (error) {
            handleError(res, error, 'Failed to create brief');
        }
    }

    // Get Briefs by Project
    async getBriefsByProject(req, res) {
        try {
            const briefs = await Brief.findByProject(req.params.projectId);
            
            res.status(200).json({
                success: true,
                data: briefs
            });
        } catch (error) {
            handleError(res, error, 'Failed to fetch briefs');
        }
    }

    // Get Brief by ID
    async getBriefById(req, res) {
        try {
            const brief = await Brief.findById(req.params.id);
            
            if (!brief) {
                return res.status(404).json({
                    success: false,
                    message: 'Brief not found'
                });
            }

            res.status(200).json({
                success: true,
                data: brief
            });
        } catch (error) {
            handleError(res, error, 'Failed to fetch brief');
        }
    }

    // Update Brief
    async updateBrief(req, res) {
        try {
            const brief = await Brief.findById(req.params.id);
            
            if (!brief) {
                return res.status(404).json({
                    success: false,
                    message: 'Brief not found'
                });
            }

            // Update logic here
            const updatedBrief = await Brief.update(req.params.id, req.body);
            
            res.status(200).json({
                success: true,
                message: 'Brief updated successfully',
                data: updatedBrief
            });
        } catch (error) {
            handleError(res, error, 'Failed to update brief');
        }
    }

    // Create Audience
    // async createAudience(req, res) {
    //     try {
    //         const audiencePrompt = PromptTemplate.fromTemplate(`
    //             Analyze the following brief and generate audience insights:
    //             Brief Purpose: {purpose}
    //             Main Message: {mainMessage}
    //             Target Audience: {targetAudience}
                
    //             Generate:
    //             1. Detailed audience segment description
    //             2. Key audience insights
    //             3. Recommended messaging angle
    //             4. Support points
    //             5. Appropriate tone of voice
    //         `);

    //         const chain = RunnableSequence.from([
    //             audiencePrompt,
    //             chatModel,
    //             new StringOutputParser()
    //         ]);

    //         const brief = await Brief.findById(req.params.id);
    //         const aiResponse = await chain.invoke({
    //             purpose: brief.purpose,
    //             mainMessage: brief.mainMessage,
    //             targetAudience: req.body.segment
    //         });

    //         const audienceData = {
    //             ...req.body,
    //             briefId: req.params.id,
    //             insights: aiResponse
    //         };

    //         const audienceId = await Audience.create(audienceData);
    //         const audience = await Audience.findById(audienceId);
            
    //         res.status(201).json({
    //             success: true,
    //             message: 'Audience created successfully',
    //             data: audience
    //         });
    //     } catch (error) {
    //         console.error('Error creating audience:', error);
    //         res.status(500).json({
    //             success: false,
    //             message: 'Failed to create audience',
    //             error: error.message
    //         });
    //     }
    // }

    // Generate Content
    async generateContent(req, res) {
        try {
            const { briefId, audienceId, assetType } = req.body;
            const brief = await Brief.findById(briefId);
            const audience = await Audience.findById(audienceId);

            if (!brief || !audience) {
                return res.status(404).json({
                    success: false,
                    message: 'Brief or audience not found'
                });
            }

            const contentPrompt = PromptTemplate.fromTemplate(`
                Generate {assetType} based on the following brief and audience:
                
                Brief:
                Purpose: {purpose}
                Main Message: {mainMessage}
                Special Features: {specialFeatures}
                Benefits: {benefits}
                Call to Action: {callToAction}
                
                Audience:
                Segment: {segment}
                Insights: {insights}
                Messaging Angle: {messagingAngle}
                Tone: {tone}
                
                Requirements:
                1. Content must be engaging and persuasive
                2. Follow the specified tone of voice
                3. Include the main message and support points
                4. End with the call to action
                5. Format appropriately for the asset type
                6. Simple content, no more than 200 words and do not include any emojis
 
            `);


            const chain = RunnableSequence.from([
                contentPrompt,
                chatModel,
                new StringOutputParser()
            ]);

            const aiResponse = await chain.invoke({
                assetType,
                purpose: brief.purpose,
                mainMessage: brief.mainMessage,
                specialFeatures: brief.specialFeatures,
                benefits: brief.benefits,
                callToAction: brief.callToAction,
                segment: audience.segment,
                insights: audience.insights,
                messagingAngle: audience.messagingAngle,
                tone: audience.tone
            });

            const contentData = {
                briefId,
                audienceId,
                assetType,
                content: aiResponse
            };

            const contentId = await GeneratedContent.create(contentData);
            const content = await GeneratedContent.findById(contentId);
            
            res.status(201).json({
                success: true,
                message: 'Content generated successfully',
                data: content
            });
        } catch (error) {
            handleError(res, error, 'Failed to generate content');
        }
    }

    // Generate Audience Segments
    async generateAudienceSegments(brief_id, user_id) {
        try {
            // Get the brief
            const brief = await Brief.findById(brief_id);
            if (!brief) {
                return {
                    success: false,
                    message: 'Brief not found'
                };
            }
            // Get user metadata
            // const userMetadata = await UserMetadata.findByUserId(user_id);
            // Audience generation prompt
            const audiencePrompt = PromptTemplate.fromTemplate(`
                Based on the following brief, generate 2 distinct audience segments:

                Brief Information:
                Product/Service: {product}
                Main Message: {message}
                Special Features: {features}
                Benefits: {benefits}
                Beneficiaries: {beneficiaries}
                Importance: {importance}
                Additional Info: {additionalInfo}
                Call to Action: {callToAction}

                For each segment, provide:
                1. Segment Name and Description
                2. Detailed Audience Insights
                3. Messaging Angle
                4. Support Points (as bullet points)
                5. Appropriate Tone of Voice
                6. Detailed Persona Profile

                Format the response as a valid JSON array where each object has the fields:
                - segment
                - insights
                - messagingAngle
                - supportPoints
                - tone
                - personaProfile

                Make each field detailed but concise.

            `);

            const audienceChain = RunnableSequence.from([
                audiencePrompt,
                chatModel,
                new StringOutputParser()
            ]);

            const aiResponse = await audienceChain.invoke({
                product: brief.purpose,
                message: brief.main_message,
                features: brief.special_features,
                benefits: brief.benefits,
                beneficiaries: brief.beneficiaries,
                importance: brief.importance,
                additionalInfo: brief.additional_info,
                callToAction: brief.call_to_action,
                // orgType: userMetadata?.organization_type || '',
                // supportType: userMetadata?.support_type || '',
                // businessModel: userMetadata?.business_model || ''
            });
            const cleanJson = aiResponse
                            .replace('```json', '')
                            .replace('```', '')
                            .trim();
            const audiences = JSON.parse(cleanJson);
            const audienceResults = [];

            // Save each audience segment
            for (const audience of audiences) {
                const audienceData = {
                    briefId: brief_id,
                    segment: JSON.stringify(audience.segment) || null,
                    insights: JSON.stringify(audience.insights) || null,
                    messagingAngle: JSON.stringify(audience.messagingAngle) || null,
                    supportPoints: Array.isArray(audience.supportPoints) ? 
                    JSON.stringify(audience.supportPoints) : 
                    audience.supportPoints || null,
                    tone: JSON.stringify(audience.tone) || null,
                    personaProfile: JSON.stringify(audience.personaProfile) || null
                };
                audienceResults.push(audienceData);
            }
            console.log('Creating audience with data:', audienceResults);
            await Audience.create(audienceResults);
            const savedAudience = await Audience.findByBriefId(brief_id);

            return {
                success: true,
                message: 'Audience segments generated successfully',
                data: {
                    brief: brief,
                    audiences: savedAudience
                }
            };

        } catch (error) {
            handleError(res, error, 'Failed to generate audience segments');
            return {
                success: false,
                message: 'Failed to generate audience segments',
                error: error.message
            };
        }
    }

    // Update Audience Segment
    async updateAudienceSegment(req, res) {
        try {
            const { audienceId } = req.params;
            const {
                segment,
                insights,
                messaging_angle,
                support_points,
                tone,
                persona_profile
            } = req.body;

            const audience = await Audience.findById(audienceId);
            if (!audience) {
                return res.status(404).json({
                    success: false,
                    message: 'Audience segment not found'
                });
            }

            // Update the audience
            const updatedAudience = await Audience.update(audienceId, {
                segment: segment || audience.segment,
                insights: insights || audience.insights,
                messaging_angle: messaging_angle || audience.messaging_angle,
                support_points: support_points || audience.support_points,
                tone: tone || audience.tone,
                persona_profile: persona_profile || audience.persona_profile
            });

            res.status(200).json({
                success: true,
                message: 'Audience segment updated successfully',
                data: updatedAudience
            });

        } catch (error) {
            handleError(res, error, 'Failed to update audience segment');
        }
    }

    // Get Audience by Brief
    async getAudienceByBrief(req, res) {
        try {
            const audience = await Audience.findByBriefId(req.params.id);
            res.status(200).json({
                success: true,
                data: audience
            });
        } catch (error) {
            handleError(res, error, 'Failed to fetch audience by brief');
        }
    }
};

export default new BriefController(); 