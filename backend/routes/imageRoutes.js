const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/imageController');

// POST /api/images/image-batch - Lấy hình ảnh cho nhiều ProductID cùng lúc
router.post('/image-batch', ImageController.getBatchImages);

module.exports = router;
