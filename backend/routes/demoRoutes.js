const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');

// Routes cho Demo API
// GET /api/demo - Lấy tất cả sản phẩm
router.get('/', demoController.getAllItems);

// GET /api/demo/search - Tìm kiếm sản phẩm
router.get('/search', demoController.searchItems);

// GET /api/demo/:id - Lấy sản phẩm theo ID
router.get('/:id', demoController.getItemById);

// POST /api/demo - Tạo sản phẩm mới
router.post('/', demoController.createItem);

// PUT /api/demo/:id - Cập nhật sản phẩm
router.put('/:id', demoController.updateItem);

// DELETE /api/demo/:id - Xóa sản phẩm
router.delete('/:id', demoController.deleteItem);

module.exports = router;
