const express = require("express");
const router = express.Router();
const SearchController = require("../controllers/searchController");

// Default route for backward compatibility (rooms)
router.get("/", SearchController.searchRooms);

// Search rooms/products
router.get("/rooms", SearchController.searchRooms);

// Search auctions  
router.get("/auctions", SearchController.searchAuctions);

module.exports = router;
