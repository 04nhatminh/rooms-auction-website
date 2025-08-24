const express = require('express');
const router = express.Router();
const uploadImagesController = require('../controllers/uploadImagesController');
const { cloudinaryUpload } = require('../middleware/cloudinaryUpload');

// POST /api/uploads/images - Upload tất cả ảnh cho một sản phẩm (có thể có room tour)
router.post('/images', 
    cloudinaryUpload.array('images', 50), // tối đa 50 ảnh
    uploadImagesController.uploadAllProductImages
);

// GET /api/uploads/product/:ProductID/images - Lấy ảnh của một product
router.get('/product/:ProductID/images', uploadImagesController.getProductImages);

// Backward compatibility routes
router.post('/product-images', 
    cloudinaryUpload.array('images', 20),
    uploadImagesController.uploadProductImages
);

router.post('/room-tour-images',
    cloudinaryUpload.array('images', 50),
    uploadImagesController.uploadRoomTourImages
);

module.exports = router;
