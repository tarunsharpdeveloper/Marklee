import User from '../models/User.js';
import BriefQuestion from '../models/BriefQuestion.js';
import AiPrompt from '../models/AiPrompt.js';

class AdminController {

    async getUsers(req, res) {
        try {
            // Ensure we have valid numbers for page and limit
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.max(1, parseInt(req.query.limit) || 10);
            const offset = (page - 1) * limit;
            
            console.log('Fetching users with:', { page, limit, offset }); // Debug log
            
            const users = await User.findAll(offset, limit);
            res.status(200).json({
                success: true,
                message: 'Users fetched successfully',
                data: users
            });
        } catch (error) {
            console.error('Error in getUsers:', error); // Debug log
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message
            });
        }
    }

    async updateUserStatus(req, res) {
        try {
            const { userId, status } = req.body;
            await User.updateStatus(userId, status);
            
            res.status(200).json({
                success: true,
                message: 'User status updated successfully',
                data: { "id": userId, "status": status }
            });
        } catch (error) {
            res.status(500).json({  
                success: false,
                message: 'Error updating user status',
                error: error.message
            });
        }
    }

    async createBriefQuestion(req, res) {
        try {
            const data = req.body;
            const input_field_name = data.title.toLowerCase().replace(/ /g, '_').split('_').slice(0, 3).join('_');
            data.input_field_name = input_field_name;
            const briefQuestion = await BriefQuestion.create(data)
            res.status(201).json({
                success: true,
                message: 'Brief question created successfully',
                data: { "id": briefQuestion , ...req.body}  
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating brief question',
                error: error.message
            });
        }
    }

    async getBriefQuestions(req, res) {
        try {
            const briefQuestions = await BriefQuestion.findAll();
            res.status(200).json({
                success: true,
                message: 'Brief questions fetched successfully',
                data: briefQuestions
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching brief questions',
                error: error.message
            });
        }
    }

    async deleteBriefQuestion(req, res) {
        try {
            const { id } = req.params;
            const breifQuestion = await BriefQuestion.delete(id);
            console.log(breifQuestion);
            if(breifQuestion){
                res.status(200).json({
                    success: true,
                    message: 'Brief question deleted successfully',
                    data: { "id": id }
                });
            }else{
                res.status(404).json({
                    success: false,
                    message: 'Brief question not found',
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting brief question',
                error: error.message
            });
        }
    }
    
    async createAiPrompt(req, res) {
        try {
            const data = req.body;
            const aiPrompt = await AiPrompt.create(data);
            res.status(201).json({
                success: true,
                message: 'AI prompt created successfully',
                data: aiPrompt
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating AI prompt',
                error: error.message
            });
        }
    }

    async getAiPrompts(req, res) {
        try {
            const aiPrompts = await AiPrompt.findAll();
            res.status(200).json({
                success: true,
                message: 'AI prompts fetched successfully',
                data: aiPrompts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching AI prompts',
                error: error.message
            });
        }
    }

    async deleteAiPrompt(req, res) {
        try {
            const { id } = req.params;
            const aiPrompt = await AiPrompt.delete(id);
            res.status(200).json({
                success: true,
                message: 'AI prompt deleted successfully',
                data: { "id": id }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting AI prompt',
                error: error.message
            });
        }
    }

    async getAiPromptFor(req, res) {
        try {
            const { id } = req.params;
            const aiPrompt = await AiPrompt.getPromptFor(id);
            res.status(200).json({
                success: true,
                message: 'AI prompt fetched successfully',
                data: aiPrompt
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching AI prompt',
                error: error.message
            });
        }
    }

    async getAiPromptsType(req, res) {
        try {
            const aiPromptsType = await AiPrompt.getAllPromptsType();
            res.status(200).json({
                success: true,
                message: 'AI prompts type fetched successfully',
                data: aiPromptsType
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching AI prompts type',
                error: error.message
            });
        }
    }

    async resetDefaultPrompts(req, res) {
        try {
            // Delete existing prompts
            await AiPrompt.deleteAll();
            
            // Insert default prompts
            const defaultAudiencePrompt = `Based on the following brief, generate 2 distinct audience segments:

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

Make each field detailed but concise.`;

            const defaultContentPrompt = `Generate {assetType} based on the following brief and audience:

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
6. Simple content, no more than 200 words and do not include any emojis`;

            await AiPrompt.create({ prompt_for_id: 1, prompt: defaultAudiencePrompt });
            await AiPrompt.create({ prompt_for_id: 2, prompt: defaultContentPrompt });

            res.status(200).json({
                success: true,
                message: 'Default prompts reset successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error resetting default prompts',
                error: error.message
            });
        }
    }
}

export default new AdminController();