const Brief = require('../models/Brief');
const Audience = require('../models/Audience');
const Project = require('../models/Project');
const GeneratedContent = require('../models/GeneratedContent');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');

// Initialize ChatOpenAI
const chatModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7
});

const briefController = {
    // Create Project
    async createProject(req, res) {
        try {
            const projectId = await Project.create(req.body);
            const project = await Project.findById(projectId);
            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: project
            });
        }
        catch (error) {
            console.error('Error creating project:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create project',
                error: error.message
            });
        }
    },

    // Get Projects
    async getProjects(req, res) {
        try {
            const projects = await Project.findByUser(req.user.id);
            res.status(200).json({
                success: true,
                data: projects
            });
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    },

    // Create Brief
    async createBrief(req, res) {
        try {
            const briefId = await Brief.create(req.body);
            const brief = await Brief.findById(briefId);
            
            res.status(201).json({
                success: true,
                message: 'Brief created successfully',
                data: brief
            });
        } catch (error) {
            console.error('Brief creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brief',
                error: error.message
            });
        }
    },

    // Get Briefs by Project
    async getBriefsByProject(req, res) {
        try {
            const briefs = await Brief.findByProject(req.params.projectId);
            
            res.status(200).json({
                success: true,
                data: briefs
            });
        } catch (error) {
            console.error('Error fetching briefs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch briefs',
                error: error.message
            });
        }
    },

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
            console.error('Error fetching brief:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brief',
                error: error.message
            });
        }
    },

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
            console.error('Error updating brief:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update brief',
                error: error.message
            });
        }
    },

    // Create Audience
    async createAudience(req, res) {
        try {
            const audiencePrompt = PromptTemplate.fromTemplate(`
                Analyze the following brief and generate audience insights:
                Brief Purpose: {purpose}
                Main Message: {mainMessage}
                Target Audience: {targetAudience}
                
                Generate:
                1. Detailed audience segment description
                2. Key audience insights
                3. Recommended messaging angle
                4. Support points
                5. Appropriate tone of voice
            `);

            const chain = RunnableSequence.from([
                audiencePrompt,
                chatModel,
                new StringOutputParser()
            ]);

            const brief = await Brief.findById(req.params.id);
            const aiResponse = await chain.invoke({
                purpose: brief.purpose,
                mainMessage: brief.mainMessage,
                targetAudience: req.body.segment
            });

            const audienceData = {
                ...req.body,
                briefId: req.params.id,
                insights: aiResponse
            };

            const audienceId = await Audience.create(audienceData);
            const audience = await Audience.findById(audienceId);
            
            res.status(201).json({
                success: true,
                message: 'Audience created successfully',
                data: audience
            });
        } catch (error) {
            console.error('Error creating audience:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create audience',
                error: error.message
            });
        }
    },

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
            console.error('Error generating content:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate content',
                error: error.message
            });
        }
    }
};

module.exports = briefController; 