import express from 'express';
import authController from '../controllers/authController.js';
import validateRequest from '../middlewares/validateRequest.js';
import authSchema from '../utils/validationSchema.js';
import { forgotPasswordSchema, resetPasswordSchema } from '../utils/validationSchema.js';

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

export default router; 