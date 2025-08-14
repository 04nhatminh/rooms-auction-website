const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// GET /api/images/:productId - Lấy hình ảnh đầu tiên cho một ProductID
router.get('/:productId', ImageController.getFirstImage);

// GET /api/images/:productId/all - Lấy tất cả hình ảnh cho một ProductID
router.get('/:productId/all', ImageController.getAllImages);

// POST /api/images/batch - Lấy hình ảnh cho nhiều ProductID cùng lúc
router.post('/batch', ImageController.getBatchImages);

module.exports = router;
