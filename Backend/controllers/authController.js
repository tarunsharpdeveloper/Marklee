const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  async signup(req, res) {
    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: { email: 'User with this email already exists' }
        });
      }

      // Create new user
      const user = new User(username, email, password);
      await user.save();

      res.status(201).json({ 
        success: true,
        message: 'User created successfully' 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ 
          message: 'Authentication failed',
          errors: { email: 'Invalid email or password' }
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          message: 'Authentication failed',
          errors: { password: 'Invalid email or password' }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  },

  async check(req, res) {
    res.json({ message: 'User is authenticated' });
  }
};

module.exports = authController; 