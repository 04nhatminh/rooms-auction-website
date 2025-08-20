const express = require('express');
const router = express.Router();
const SystemParametersController = require('../controllers/systemParametersController');

// GET /api/system-parameters/get-parameters
router.get('/get-parameters', SystemParametersController.getAllParameters);

module.exports = router;