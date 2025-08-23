const express = require('express');
const router = express.Router();
const AuctionController = require('../controllers/auctionController');

// GET /api/auction/province/:provinceCode?status=<status>&limit=<limit>
router.get('/province/:provinceCode', AuctionController.getAuctionsByProvinceByStatus);

// GET /api/auction/district/:districtCode?status=<status>&limit=<limit>
router.get('/district/:districtCode', AuctionController.getAuctionsByDistrictByStatus);

// GET /api/auction/ending-soon
router.get('/ending-soon', AuctionController.getEndingSoonAuctions);

// GET /api/auction/featured
router.get('/featured', AuctionController.getFeaturedAuctions);

// GET /api/auction/newest
router.get('/newest', AuctionController.getNewestAuctions);

// GET /api/auction/:auctionId
router.get('/:auctionId', AuctionController.getAuctionById);

module.exports = router;