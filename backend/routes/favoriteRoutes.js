const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /favorite - Lấy danh sách yêu thích
router.get('/', verifyToken, favoriteController.getUserFavorites);

// POST /favorite/:uid - Thêm vào yêu thích
router.post('/:uid', verifyToken, favoriteController.addFavorite);

// DELETE /favorite/:uid - Xóa khỏi yêu thích
router.delete('/:uid', verifyToken, favoriteController.removeFavorite);

module.exports = router;