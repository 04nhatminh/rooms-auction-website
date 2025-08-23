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
router.get('/admin/search', verifyToken, ProductController.searchProductsByUID);
router.post('/admin/create', verifyToken, ProductController.createProduct);
router.put('/admin/:id', verifyToken, ProductController.updateProduct);
router.delete('/admin/:id', verifyToken, ProductController.deleteProduct);

// GET /api/room/properties/types - Lấy danh sách property types
router.get('/properties/types', ProductController.getAllPropertyTypes);

// GET /api/room/room-types - Lấy danh sách room types
router.get('/room-types', ProductController.getAllRoomTypes);

// GET /api/room/amenity-groups - Lấy danh sách amenity groups
router.get('/amenity-groups', ProductController.getAllAmenityGroups);

// GET /api/room/amenities - Lấy danh sách amenities
router.get('/amenities', ProductController.getAllAmenities);

// GET /api/room/id - Lấy chi tiết sản phẩm theo Product ID
router.get('/:UID', ProductController.getFullProductDataByProductId);

module.exports = router;
