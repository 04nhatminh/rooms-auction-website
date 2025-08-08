const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// GET /api/images/:externalId - Lấy hình ảnh đầu tiên cho một ExternalID
router.get('/:externalId', ImageController.getFirstImage);

// GET /api/images/:externalId/all - Lấy tất cả hình ảnh cho một ExternalID
router.get('/:externalId/all', ImageController.getAllImages);

// GET /api/images/reviews/:listingId - Lấy total_reviews cho một listing_id
router.get('/reviews/:listingId', ImageController.getTotalReviews);

// POST /api/images/batch - Lấy hình ảnh cho nhiều ExternalID cùng lúc
router.post('/batch', ImageController.getBatchImages);

// POST /api/images/reviews/batch - Lấy total_reviews cho nhiều listing_id cùng lúc
router.post('/reviews/batch', ImageController.getBatchTotalReviews);

module.exports = router;
