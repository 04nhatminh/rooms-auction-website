const express = require('express');
const { getGeocode } = require('../controllers/geocodeController');

const router = express.Router();

// GET /api/geocode?q=...
router.get('/', getGeocode);

module.exports = router;
