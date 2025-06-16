import express from 'express';
import authController from '../controllers/authController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { authSchema } from '../utils/validationSchema.js';

const router = express.Router();

// Registration and verification routes
router.post('/register', validateRequest(authSchema.signup), authController.register);
router.post('/verify-email', validateRequest(authSchema.verifyEmail), authController.verifyEmail);
router.post('/resend-otp', validateRequest(authSchema.resendOTP), authController.resendOTP);

// Login route
router.post('/login', validateRequest(authSchema.login), authController.login);

// Protected route example
// router.get('/me', auth, (req, res) => {
//   res.json({
//     user: {
//       id: req.user.id,
//       username: req.user.username,
//       email: req.user.email
//     }
//   });
// });

export default router; 