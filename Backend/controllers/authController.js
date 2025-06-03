const jwt = require('jsonwebtoken');
const User = require('../models/User');
const emailService = require('../utils/emailService');
const bcrypt = require('bcryptjs');

const authController = {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create user and generate OTP
      const { userId, otp } = await User.create({ email, password, name });

      // Send OTP email
      const emailSent = await emailService.sendOTP(email, otp);
      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for OTP verification.',
        userId
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;

      const isVerified = await User.verifyOTP(email, otp);
      if (!isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Generate JWT token
      const user = await User.findByEmail(email);
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // remove password from user
      delete user.password;

      res.json({
        success: true,
        message: 'Email verified successfully',
        token,
        user
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed'
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!user.is_verified) {
        // Regenerate OTP for unverified users
        const otp = await User.regenerateOTP(email);
        await emailService.sendOTP(email, otp);

        return res.status(403).json({
          success: false,
          message: 'Email not verified. New OTP has been sent to your email.'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      // remove password from user
      delete user.password;
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed ' + error
      });
    }
  },

  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified'
        });
      }

      const otp = await User.regenerateOTP(email);
      const emailSent = await emailService.sendOTP(email, otp);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email'
        });
      }

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }
  }
};

module.exports = authController; 