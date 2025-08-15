const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');

// GET /api/locations/suggestions - Auto suggestion cho tìm kiếm địa điểm (tối ưu cho autocomplete)
// router.get('/suggestions', LocationController.getLocationSuggestions);

// GET /api/locations/popular - Lấy top locations phổ biến để preload
router.get('/popular', LocationController.getPopularLocations);

// GET /api/locations/search - Tìm kiếm địa điểm (provinces và districts)
router.get('/search', LocationController.searchLocations);

// GET /api/locations/provinces - Lấy tất cả provinces
router.get('/provinces', LocationController.getAllProvinces);

// GET /api/locations/districts - Lấy tất cả districts
router.get('/districts', LocationController.getAllDistricts);

// GET /api/locations/provinces/:provinceCode/districts - Lấy districts theo province
router.get('/provinces/:provinceCode/districts', LocationController.getDistrictsByProvince);

// GET /api/locations/provinces/:provinceCode - Lấy chi tiết province theo code
router.get('/provinces/:provinceCode', LocationController.getProvinceDetails);

// GET /api/locations/districts/:districtCode - Lấy chi tiết district theo code
router.get('/districts/:districtCode', LocationController.getDistrictDetails);

module.exports = router;
