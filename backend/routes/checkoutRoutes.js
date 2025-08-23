const express = require('express');
const CheckoutController = require('../controllers/checkoutController');
const router = express.Router();

router.post('/paypal/create', CheckoutController.createOrderPaypal);
router.post('/paypal/capture', CheckoutController.captureOrderPaypal);

router.post('/zalopay/create', CheckoutController.createOrderZaloPay);
router.get('/checkout/zalopay/return', CheckoutController.handleReturnZaloPay);
router.post('/webhooks/zalopay', CheckoutController.webhookZaloPay);

router.get('/:bookingId', CheckoutController.getBookingDetails);

module.exports = router;