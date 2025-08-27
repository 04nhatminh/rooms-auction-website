const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const AuctionController = require('../controllers/auctionController');
const bookingController = require('../controllers/bookingController');
const NotificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { cloudinaryUpload } = require('../middleware/cloudinaryUpload.js');
const uploadImagesController = require('../controllers/uploadImagesController');

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
router.post('/me/avatar', verifyToken, cloudinaryUpload.single('avatar'), uploadImagesController.uploadUserAvatar);

// Auction and Booking History
router.get('/auction-history', verifyToken, AuctionController.getUserAuctionHistory);
router.get('/transaction-history', verifyToken, bookingController.getUserTransactionHistory);

// Notification
router.get('/notifications', verifyToken, NotificationController.getUserNotifications);
router.post('/notifications/:id/read', verifyToken, NotificationController.markAsRead);

module.exports = router;