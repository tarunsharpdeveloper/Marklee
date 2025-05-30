const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');
const authSchema = require('../utils/validationSchema');

// Public routes
router.post('/signup', validateRequest(authSchema.signup), authController.signup);
router.post('/login', validateRequest(authSchema.login), authController.login);
router.get('/check', authController.check);

// Protected route example
router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router; 