// routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

router.get('/check', calendarController.checkAvailability);
router.post('/block', calendarController.blockRange);
router.post('/reserve', calendarController.reserveRange);
router.post('/release-expired-holds', calendarController.releaseExpiredHolds);

module.exports = router;
