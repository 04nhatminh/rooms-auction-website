const express = require('express');
const router = express.Router();
const SystemParametersController = require('../controllers/systemParametersController');

// GET /api/system-parameters/get-parameters
router.get('/get-parameters', SystemParametersController.getAllParameters);

// PUT /api/system-parameters/update-parameter/:paramName
router.put('/update-parameter/:paramName', SystemParametersController.updateParameter);

router.get('/get-payment-deadline-time', SystemParametersController.getPaymentDeadlineTime);

module.exports = router;