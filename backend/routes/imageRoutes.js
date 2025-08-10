const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// GET /api/images/:productId - Lấy hình ảnh đầu tiên cho một ProductID
router.get('/:productId', ImageController.getFirstImage);

// GET /api/images/:productId/all - Lấy tất cả hình ảnh cho một ProductID
router.get('/:productId/all', ImageController.getAllImages);

// GET /api/images/reviews/:productId - Lấy total_reviews cho một productId
router.get('/reviews/:productId', ImageController.getTotalReviews);

// POST /api/images/batch - Lấy hình ảnh cho nhiều ProductID cùng lúc
router.post('/batch', ImageController.getBatchImages);

// POST /api/images/reviews/batch - Lấy total_reviews cho nhiều productId cùng lúc
router.post('/reviews/batch', ImageController.getBatchTotalReviews);

module.exports = router;
