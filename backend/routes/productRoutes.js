const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /product/id - Lấy chi tiết sản phẩm theo ID
router.get('/:id', productController.getFullProductDataById);

module.exports = router;