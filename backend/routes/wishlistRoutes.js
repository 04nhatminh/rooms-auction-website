const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/authMiddleware');

// Lấy danh sách wishlist của user
router.get('/', verifyToken, WishlistController.getUserWishlist);

// Thêm sản phẩm vào wishlist
router.post('/:productId', verifyToken, WishlistController.addWishlist);

// Xóa sản phẩm khỏi wishlist
router.delete('/:productId', verifyToken, WishlistController.removeWishlist);

module.exports = router;
