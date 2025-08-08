const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// GET /api/images/:externalId - Lấy hình ảnh đầu tiên cho một ExternalID
router.get('/:externalId', ImageController.getFirstImage);

// GET /api/images/:externalId/all - Lấy tất cả hình ảnh cho một ExternalID
router.get('/:externalId/all', ImageController.getAllImages);

// POST /api/images/batch - Lấy hình ảnh cho nhiều ExternalID cùng lúc
router.post('/batch', ImageController.getBatchImages);

module.exports = router;
