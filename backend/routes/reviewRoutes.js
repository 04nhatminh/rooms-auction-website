const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');

// GET /api/reviews/:productId - Lấy total_reviews cho một productId
router.get('/:productId', ReviewController.getTotalReviews);

// POST /api/reviews/batch - Lấy total_reviews cho nhiều productId cùng lúc
router.post('/batch', ReviewController.getBatchTotalReviews);

module.exports = router;
