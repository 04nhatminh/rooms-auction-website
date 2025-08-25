const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auctionController = require('../controllers/auctionController');
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

// Auction management routes
// Lấy danh sách tất cả auction
router.get('/auctions', verifyToken, isAdmin, auctionController.getAllAuctionsForAdmin);
// Lấy danh sách tất cả auction theo status
router.get('/auctions/status/:status', verifyToken, isAdmin, auctionController.getAllAuctionsByStatusForAdmin);
// Cập nhật trạng thái auction
// router.patch('/auctions/:id/status', verifyToken, isAdmin, auctionController.updateAuctionStatus);
// Tìm kiếm auction theo UID
router.get('/auctions/search/:uid', verifyToken, isAdmin, auctionController.searchAuctionsByUID);


// Data scraping routes
// Chạy script thu thập dữ liệu listing info
router.post('/scraping/listing', verifyToken, isAdmin, scrapingController.runListingInfoScraping);
// Chạy script thu thập dữ liệu reviews
router.post('/scraping/review', verifyToken, isAdmin, scrapingController.runReviewScraping);

module.exports = router;
