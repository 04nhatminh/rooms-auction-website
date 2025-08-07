const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Lấy danh sách tất cả user
router.get('/users', verifyToken, isAdmin, userController.getAllUsers);

module.exports = router;
