// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/place', bookingController.place);
// router.post('/payments/confirm', bookingController.confirmPayment);
// router.post('/payments/fail', bookingController.paymentFail);

module.exports = router;
