const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Lấy danh sách tất cả user
router.get('/users', verifyToken, isAdmin, userController.getAllUsers);
// Xóa user theo ID
router.delete('/users/:id', verifyToken, isAdmin, userController.deleteUser);
// Lấy thông tin user theo ID
router.get('/users/:id', verifyToken, isAdmin, userController.getUserById);
// Cập nhật trạng thái user
router.patch('/users/:id/status', verifyToken, isAdmin, userController.updateUserStatus);

module.exports = router;
