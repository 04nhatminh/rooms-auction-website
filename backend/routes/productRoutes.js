const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/room/top-rated - Lấy top products theo province code
router.get('/top-rated/province', ProductController.getTopRatedProductsByProvince);

// GET /api/room/district/top-rated - Lấy top products theo district code
router.get('/top-rated/district', ProductController.getTopRatedProductsByDistrict);

// Admin routes - Cần authentication
router.get('/admin/list', verifyToken, ProductController.getAllProductsForAdmin);
router.post('/admin/create', verifyToken, ProductController.createProduct);
router.put('/admin/:id', verifyToken, ProductController.updateProduct);
router.delete('/admin/:id', verifyToken, ProductController.deleteProduct);

// GET /room/id - Lấy chi tiết sản phẩm theo Product ID
router.get('/:UID', ProductController.getFullProductDataByProductId);

// GET /api/properties/types - Lấy danh sách property types
router.get('/properties/types', ProductController.getAllPropertyTypes);

module.exports = router;
