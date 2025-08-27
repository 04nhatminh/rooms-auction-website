const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auctionController = require('../controllers/auctionController');
const bookingController = require('../controllers/bookingController');
const scrapingController = require('../controllers/scrapingController');
const statisticsController = require('../controllers/statisticsController');
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
// Lấy chi tiết auction cho admin
router.get('/auctions/:auctionUID', verifyToken, isAdmin, auctionController.getAuctionDetailsForAdmin);
// Cập nhật trạng thái auction
router.patch('/auctions/:auctionUID/status', verifyToken, isAdmin, auctionController.updateAuctionStatus);
// Tìm kiếm auction theo UID
router.get('/auctions/search/:uid', verifyToken, isAdmin, auctionController.searchAuctionsByUID);

// Booking management routes
// Lấy danh sách tất cả booking
router.get('/bookings', verifyToken, isAdmin, bookingController.getAllBookingsForAdmin);
// Lấy danh sách booking theo status
router.get('/bookings/status/:status', verifyToken, isAdmin, bookingController.getBookingsByStatusForAdmin);
// Tìm kiếm booking theo ID
router.get('/bookings/search/:bookingId', verifyToken, isAdmin, bookingController.searchBookingsByIdForAdmin);
// Lấy chi tiết booking
router.get('/bookings/:bookingId', verifyToken, isAdmin, bookingController.getBookingDetailsForAdmin);
// Cập nhật booking
router.put('/bookings/:bookingId', verifyToken, isAdmin, bookingController.updateBookingForAdmin);


// Cấu hình hệ thống

// Dashboard stats routes
// Thống kê tổng quan dashboard
router.get('/dashboard/stats', verifyToken, isAdmin, statisticsController.getDashboardStats);
// Thống kê doanh thu theo thời gian
router.get('/dashboard/revenue', verifyToken, isAdmin, statisticsController.getRevenueStats);
// Thống kê khách hàng
router.get('/dashboard/customers', verifyToken, isAdmin, statisticsController.getCustomerStats);
// Thống kê sản phẩm
router.get('/dashboard/products', verifyToken, isAdmin, statisticsController.getProductStats);
// Thống kê booking theo thời gian
router.get('/dashboard/bookings', verifyToken, isAdmin, statisticsController.getBookingStats);
// Thống kê bids theo thời gian
router.get('/dashboard/bids', verifyToken, isAdmin, statisticsController.getBidsStats);


// Data scraping routes
// Chạy script thu thập dữ liệu listing info
router.post('/scraping/listing', verifyToken, isAdmin, scrapingController.runListingInfoScraping);
// Chạy script thu thập dữ liệu reviews
router.post('/scraping/review', verifyToken, isAdmin, scrapingController.runReviewScraping);

module.exports = router;
