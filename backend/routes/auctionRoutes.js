const express = require('express');
const router = express.Router();
const AuctionController = require('../controllers/auctionController');

// GET /api/auction/province/:provinceCode?status=<status>&limit=<limit>
router.get('/province/:provinceCode', AuctionController.getAuctionsByProvinceByStatus);

// GET /api/auction/district/:districtCode?status=<status>&limit=<limit>
router.get('/district/:districtCode', AuctionController.getAuctionsByDistrictByStatus);

// GET /api/auction/:auctionId
router.get('/:auctionId', AuctionController.getAuctionById);

module.exports = router;