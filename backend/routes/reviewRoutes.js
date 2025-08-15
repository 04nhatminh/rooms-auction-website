const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');

// POST /api/reviews/batch - Lấy total_reviews cho nhiều productId cùng lúc
router.post('/review-batch', ReviewController.getBatchTotalReviews);

module.exports = router;
