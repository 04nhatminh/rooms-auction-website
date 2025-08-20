const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const scrapingController = require('../controllers/scrapingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// User management routes
// Lấy danh sách tất cả user
router.get('/users', verifyToken, isAdmin, userController.getAllUsers);
// Xóa user theo ID
router.delete('/users/:id', verifyToken, isAdmin, userController.deleteUser);
// Lấy thông tin user theo ID
router.get('/users/:id', verifyToken, isAdmin, userController.getUserById);
// Cập nhật trạng thái user
router.patch('/users/:id/status', verifyToken, isAdmin, userController.updateUserStatus);

// Data scraping routes
// Chạy script thu thập dữ liệu listing info
router.post('/scraping/listing', verifyToken, isAdmin, scrapingController.runListingInfoScraping);
// Chạy script thu thập dữ liệu reviews
router.post('/scraping/review', verifyToken, isAdmin, scrapingController.runReviewScraping);

module.exports = router;
