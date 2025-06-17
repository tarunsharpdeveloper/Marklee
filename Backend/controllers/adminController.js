import User from '../models/User.js';
import BriefQuestion from '../models/BriefQuestion.js';

const adminController = {
    getUsers: async (req, res) => {
        try {
            const { page=1, limit=10 } = req.query;
            const offset = (page - 1) * limit;
            const users = await User.findAll(offset, limit);
            res.status(200).json({
                success: true,
                message: 'Users fetched successfully',
                data: users
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: error.message
            });
        }
    },

    updateUserStatus: async (req, res) => {
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
    },

    createBriefQuestion: async (req, res) => {
        try {
            const data = req.body;
            const input_field_name = data.ai_key.toLowerCase().replace(/ /g, '_').split('_').slice(0, 2).join('_');
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
    },

    getBriefQuestions: async (req, res) => {
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
    },

    deleteBriefQuestion: async (req, res) => {
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
}

export default adminController;