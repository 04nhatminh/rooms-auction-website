const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// GET /api/products/provinces - Lấy danh sách provinces có products
router.get('/provinces', ProductController.getProvinces);

// GET /api/products/top-rated - Lấy top products theo province code
router.get('/top-rated', ProductController.getTopRatedProducts);

// GET /api/products/search - Tìm kiếm products theo nhiều tiêu chí
router.get('/search', ProductController.searchProducts);

// GET /api/products/:id - Lấy chi tiết product theo ID
router.get('/:id', ProductController.getProductDetails);

module.exports = router;
