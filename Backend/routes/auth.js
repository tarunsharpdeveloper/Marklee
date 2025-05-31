const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');
const authSchema = require('../utils/validationSchema');

// Registration and verification routes
router.post('/register', validateRequest(authSchema.signup), authController.register);
router.post('/verify-email', validateRequest(authSchema.verifyEmail), authController.verifyEmail);
router.post('/resend-otp', validateRequest(authSchema.resendOTP), authController.resendOTP);

// Login route
router.post('/login', validateRequest(authSchema.login), authController.login);

// Protected route example
router.get('/me', (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router; 