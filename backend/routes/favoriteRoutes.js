const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /favorite - Lấy danh sách yêu thích
router.get('/', verifyToken, favoriteController.getUserFavorites);

// POST /favorite/:productId - Thêm vào yêu thích
router.post('/:productId', verifyToken, favoriteController.addFavorite);

// DELETE /favorite/:productId - Xóa khỏi yêu thích
router.delete('/:productId', verifyToken, favoriteController.removeFavorite);

module.exports = router;