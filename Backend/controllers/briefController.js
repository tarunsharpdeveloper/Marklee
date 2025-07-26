import Brief from '../models/Brief.js';
import Audience from '../models/Audience.js';
import Project from '../models/Project.js';
import GeneratedContent from '../models/GeneratedContent.js';
import UserMetadata from '../models/UserMetadata.js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import AiPrompt from '../models/AiPrompt.js';

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
            const projectId = await Project.create({
                projectName: req.body.projectName.trim(),
                userId: req.user.id
            });
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

    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { projectName } = req.body;
            
            if (!projectName || !projectName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Project name is required'
                });
            }

            // Check if project exists and belongs to user
            const existingProject = await Project.findById(id);
            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            if (existingProject.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check if new name already exists for this user
            const projectWithSameName = await Project.findByName(projectName.trim(), req.user.id);
            if (projectWithSameName && projectWithSameName.id !== parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Project with this name already exists'
                });
            }

            // Update the project
            await Project.update(id, {
                projectName: projectName.trim()
            });

            const updatedProject = await Project.findById(id);
            res.status(200).json({
                success: true,
                message: 'Project updated successfully',
                data: updatedProject
            });
        }
        catch (error) {
            handleError(res, error, 'Failed to update project');
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
            // Map dynamic field names to expected brief field names
            const mapDynamicFieldsToBriefFields = (dynamicData) => {
                const fieldMapping = {
                    'purpose': 'purpose',
                    'main_message': 'mainMessage',
                    'special_features': 'specialFeatures',
                    'beneficiaries': 'beneficiaries',
                    'benefits': 'benefits',
                    'call_to_action': 'callToAction',
                    'importance': 'importance',
                    'additional_info': 'additionalInfo'
                };

                const mappedData = {
                    projectId: dynamicData.projectId,
                    projectName: dynamicData.projectName
                };

                // Map each dynamic field to the expected field name
                Object.keys(dynamicData).forEach(key => {
                    if (fieldMapping[key]) {
                        mappedData[fieldMapping[key]] = dynamicData[key] || '';
                    }
                });

                // Ensure all required fields are present with default values
                const requiredFields = ['purpose', 'mainMessage', 'specialFeatures', 'beneficiaries', 'benefits', 'callToAction', 'importance', 'additionalInfo'];
                requiredFields.forEach(field => {
                    if (!mappedData[field]) {
                        mappedData[field] = '';
                    }
                });

                return mappedData;
            };

            const mappedBriefData = mapDynamicFieldsToBriefFields(req.body);
            console.log('Mapped brief data:', mappedBriefData); // Debug log

            const briefId = await Brief.create(mappedBriefData);
            
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

            // Fetch content prompt from database (prompt_for_id = 2 for content)
            const aiPrompt = await AiPrompt.getPromptFor(2);
            if (!aiPrompt || aiPrompt.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Content prompt not found in database'
                });
            }

            const contentPrompt = PromptTemplate.fromTemplate(aiPrompt[0].prompt);

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

            // Fetch audience prompt from database (prompt_for_id = 1 for audience)
            const aiPrompt = await AiPrompt.getPromptFor(1);
            console.log('Fetched audience prompt:', aiPrompt);
            
            if (!aiPrompt || aiPrompt.length === 0) {
                return {
                    success: false,
                    message: 'Audience prompt not found in database'
                };
            }

            // Use the first prompt if multiple exist
            const selectedPrompt = aiPrompt[0];
            console.log('Using prompt:', selectedPrompt.prompt);

            const audiencePrompt = PromptTemplate.fromTemplate(selectedPrompt.prompt);

            const audienceChain = RunnableSequence.from([
                audiencePrompt,
                chatModel,
                new StringOutputParser()
            ]);

            const promptVariables = {
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
            };

            console.log('Prompt variables:', promptVariables);

            const aiResponse = await audienceChain.invoke(promptVariables);
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
            console.error('Error generating audience segments:', error);
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

    // Delete selected audiences
    async deleteAudiences(req, res) {
        try {
            const { audienceIds } = req.body;
            const briefId = req.params.id;

            // Validate input
            if (!Array.isArray(audienceIds) || audienceIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide at least one audience ID to delete'
                });
            }

            // Delete audiences from database
            await Audience.deleteMany(briefId, audienceIds);

            res.status(200).json({
                success: true,
                message: 'Audiences deleted successfully'
            });
        } catch (error) {
            handleError(res, error, 'Failed to delete audiences');
        }
    }
};

export default new BriefController(); 