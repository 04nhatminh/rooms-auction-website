const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/auth/google/callback', authController.googleCallback);

module.exports = router;
