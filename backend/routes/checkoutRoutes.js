const express = require('express');
const CheckoutController = require('../controllers/checkoutController');
const router = express.Router();

router.post('/paypal/create', CheckoutController.createOrderPaypal);
router.post('/paypal/capture', CheckoutController.captureOrderPaypal);

router.post('/zalopay/create', CheckoutController.createOrderZaloPay);
router.get('/zalopay/return', CheckoutController.handleReturnZaloPay);
router.post('/webhooks/zalopay',
  express.urlencoded({ extended: false }),
  express.json(),
  (req, res) => CheckoutController.webhookZaloPay(req, res)
);


router.post('/zalopay/query', (req, res) => CheckoutController.queryZaloPay(req, res));


router.get('/booking/:bookingId', CheckoutController.getBookingDetails);
router.get('/booking/cancel/:bookingId', CheckoutController.cancelBooking);

module.exports = router;