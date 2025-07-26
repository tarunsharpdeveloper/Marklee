import express from 'express';
import authController from '../controllers/authController.js';
import validateRequest from '../middlewares/validateRequest.js';
import authSchema from '../utils/validationSchema.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../utils/validationSchema.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

// Registration and verification routes
router.post('/register', validateRequest(authSchema.signup), authController.register);
router.post('/verify-email', validateRequest(authSchema.verifyEmail), authController.verifyEmail);
router.post('/resend-otp', validateRequest(authSchema.resendOTP), authController.resendOTP);

// Login route
router.post('/login', validateRequest(authSchema.login), authController.login);

// Password reset routes
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

// Google OAuth route
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    // Verify the Google token with both client ID and secret
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists
    const User = (await import('../models/User.js')).default;
    const UserOnboarding = (await import('../models/UserOnboarding.js')).default;
    
    let user = await User.findByEmail(email);
    let isUserMetaData = true; // Always set to true so users go directly to dashboard

    if (user) {
      // User exists - no need to check onboarding status
    } else {
      // Create new user
      const randomPassword = 'google-oauth-' + Math.random().toString(36).substring(2, 15);
      const { userId } = await User.create({
        email,
        password: randomPassword,
        name
      });
      
      // Mark user as verified since they came from Google
      await User.verifyOTP(email, '000000'); // This will mark them as verified
      
      user = await User.findById(userId);
    }

    // Generate JWT token
    const jwt = (await import('jsonwebtoken')).default;
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Remove sensitive data before sending
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      user: userResponse,
      isEmailVerified: true,
      isUserMetaData: isUserMetaData
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

// Facebook OAuth route
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userID, email, name } = req.body;
    
    if (!accessToken || !userID || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Facebook authentication data is required'
      });
    }

    // Verify the Facebook access token
    const verifyResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`);
    const verifyData = await verifyResponse.json();

    if (!verifyData.data || !verifyData.data.is_valid || verifyData.data.app_id !== process.env.FACEBOOK_APP_ID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Facebook token'
      });
    }

    // Check if user exists
    const User = (await import('../models/User.js')).default;
    const UserOnboarding = (await import('../models/UserOnboarding.js')).default;
    
    let user = await User.findByEmail(email);
    let isUserMetaData = true; // Always set to true so users go directly to dashboard

    if (user) {
      // User exists - no need to check onboarding status
    } else {
      // Create new user
      const randomPassword = 'facebook-oauth-' + Math.random().toString(36).substring(2, 15);
      const { userId } = await User.create({
        email,
        password: randomPassword,
        name
      });
      
      // Mark user as verified since they came from Facebook
      await User.verifyOTP(email, '000000'); // This will mark them as verified
      
      user = await User.findById(userId);
    }

    // Generate JWT token
    const jwt = (await import('jsonwebtoken')).default;
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Remove sensitive data before sending
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Facebook login successful',
      token: jwtToken,
      user: userResponse,
      isEmailVerified: true,
      isUserMetaData: isUserMetaData
    });

  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Facebook authentication failed'
    });
  }
});

export default router; 