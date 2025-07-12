import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import emailService from '../utils/emailService.js';
import bcrypt from 'bcrypt';
import UserMetadata from '../models/UserMetadata.js';
import UserOnboarding from '../models/UserOnboarding.js';

class AuthController {
  async register(req, res) {
    try {
      console.log('Starting registration process for email:', req.body.email);
      const { email, password, name } = req.body;

      // Check if user already exists
      console.log('Checking if user exists...');
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      // Create user and generate OTP
      console.log('Creating new user and generating OTP...');
      const { userId, otp } = await User.create({ email, password, name });
      console.log('User created with ID:', userId, 'OTP generated:', otp);

      // Send OTP email
      console.log('Attempting to send OTP email...');
      const emailSent = await emailService.sendOTP(email, otp);
      console.log('Email send attempt result:', emailSent);
      
      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email",
        });
      }

      console.log('Registration successful for user:', userId);
      res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email for OTP verification.",
        userId,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;

      const isVerified = await User.verifyOTP(email, otp);
      if (!isVerified) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      // Generate JWT token
      const user = await User.findByEmail(email);
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      
      // Remove sensitive data before sending
      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        message: "Email verified successfully",
        token,
        user: userResponse,
        isEmailVerified: true
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({
        success: false,
        message: "Verification failed",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user || user.status === 'inactive') {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or account is inactive'
        });
      }

      let isUserMetaData = true;

      if(user.role !== 'admin'){
        const metadata = await UserOnboarding.findByUserId(user.id);
        isUserMetaData = metadata ? true : false;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if email is verified
      if (!user.is_verified) {
        // Generate new OTP for unverified users
        const otp = await User.regenerateOTP(email);
        await emailService.sendOTP(email, otp);
        
        return res.status(403).json({
          success: false,
          message: "Email not verified. A new verification code has been sent to your email.",
          requiresVerification: true,
          isUserMetaData: isUserMetaData,
          email: user.email
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Remove sensitive data before sending
      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userResponse,
        isEmailVerified: true,
        isUserMetaData: isUserMetaData,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed " + error,
      });
    }
  }

  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: "Email already verified",
        });
      }

      const otp = await User.regenerateOTP(email);
      const emailSent = await emailService.sendOTP(email, otp);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }

      res.json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resend OTP",
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      console.log('Processing forgot password request for:', email);

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "If a user with this email exists, they will receive password reset instructions."
        });
      }

      const token = await User.createPasswordResetToken(email);
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      console.log('Reset link generated:', resetLink);
      const emailSent = await emailService.sendPasswordResetEmail(email, resetLink);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send reset instructions. Please try again later."
        });
      }

      res.json({
        success: true,
        message: "If a user with this email exists, they will receive password reset instructions."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process request"
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      console.log('Processing password reset for token');

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token and new password are required"
        });
      }

      const success = await User.resetPassword(token, newPassword);
      if (!success) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token"
        });
      }

      res.json({
        success: true,
        message: "Password has been reset successfully"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset password"
      });
    }
  }
}

export default new AuthController();
