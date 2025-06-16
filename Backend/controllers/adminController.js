import User from '../models/User.js';

const adminController = {
    getUsers: async (req, res) => {
        try {
            const users = await User.findAll();
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
    }
}

export default adminController;