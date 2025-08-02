const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const path = require('path');

// Add this route:
router.get('/', (req, res) => {
  res.send('User route is working!');
});


router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/verify', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);

module.exports = router;