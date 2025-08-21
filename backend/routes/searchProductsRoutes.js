const express = require("express");
const router = express.Router();
const SearchProductsController = require("../controllers/searchProductsController");

router.get("/", SearchProductsController.searchRooms);

module.exports = router;
