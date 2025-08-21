const SearchProductsModel = require("../models/searchProductsModel");

exports.searchRooms = async (req, res) => {
  try {
    const {
      province,
      district,
      checkin,
      checkout,
      guests,
      popular,
      sort,
      price_min,
      price_max,
      property_types,
      rating,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;

    const results = await SearchProductsModel.searchRooms({
      province,
      district,
      checkin,
      checkout,
      guests,
      popular,
      sort,
      price_min,
      price_max,
      property_types,
      rating,
      limit,
      offset,
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
