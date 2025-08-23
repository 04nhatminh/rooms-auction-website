const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/verify', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);
router.post('/request-reset-password', userController.requestResetPassword);
router.post('/reset-password', userController.resetPassword);

// Profile APIs
router.get('/me', verifyToken, userController.getProfile);
router.put('/me', verifyToken, userController.updateProfile);
router.put('/me/password', verifyToken, userController.changePassword);

module.exports = router;