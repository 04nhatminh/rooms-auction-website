const LocationModel = require('../models/locationModel');

class LocationController {
    /**
     * API lấy tất cả provinces
     * GET /api/locations/provinces?search=...&limit=50
     */
    static async getAllProvinces(req, res) {
        try {
            const { search, limit = 50 } = req.query;
            
            const provinces = await LocationModel.getAllProvinces(search, parseInt(limit));
            
            return res.status(200).json({
                success: true,
                message: 'Provinces retrieved successfully',
                data: {
                    total: provinces.length,
                    searchTerm: search || null,
                    limit: parseInt(limit),
                    provinces
                }
            });
        } catch (error) {
            console.error('Error in getAllProvinces:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy provinces có products
     * GET /api/locations/provinces/with-products?search=...&limit=50
     */
    static async getProvincesWithProducts(req, res) {
        try {
            const { search, limit = 50 } = req.query;
            
            const provinces = await LocationModel.getProvincesWithProducts(search, parseInt(limit));
            
            return res.status(200).json({
                success: true,
                message: 'Provinces with products retrieved successfully',
                data: {
                    total: provinces.length,
                    searchTerm: search || null,
                    limit: parseInt(limit),
                    provinces
                }
            });
        } catch (error) {
            console.error('Error in getProvincesWithProducts:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy districts theo province code
     * GET /api/locations/provinces/:provinceCode/districts?search=...&limit=100
     */
    static async getDistrictsByProvince(req, res) {
        try {
            const { provinceCode } = req.params;
            const { search, limit = 100, withProducts = false } = req.query;
            
            if (!provinceCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Province code is required'
                });
            }

            let districts;
            if (withProducts === 'true') {
                districts = await LocationModel.getDistrictsWithProductsByProvince(
                    provinceCode, 
                    search, 
                    parseInt(limit)
                );
            } else {
                districts = await LocationModel.getDistrictsByProvince(
                    provinceCode, 
                    search, 
                    parseInt(limit)
                );
            }
            
            return res.status(200).json({
                success: true,
                message: `Districts in province ${provinceCode} retrieved successfully`,
                data: {
                    provinceCode,
                    total: districts.length,
                    searchTerm: search || null,
                    limit: parseInt(limit),
                    withProducts: withProducts === 'true',
                    districts
                }
            });
        } catch (error) {
            console.error('Error in getDistrictsByProvince:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API tìm kiếm locations (cả provinces và districts)
     * GET /api/locations/search?q=...&limit=20
     */
    static async searchLocations(req, res) {
        try {
            const { q: searchTerm, limit = 20 } = req.query;
            
            if (!searchTerm || searchTerm.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term is required (parameter: q)'
                });
            }

            if (searchTerm.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term must be at least 2 characters long'
                });
            }
            
            const results = await LocationModel.searchLocations(searchTerm, parseInt(limit));
            
            return res.status(200).json({
                success: true,
                message: 'Location search completed successfully',
                data: {
                    searchTerm,
                    limit: parseInt(limit),
                    totalProvinces: results.provinces.length,
                    totalDistricts: results.districts.length,
                    totalResults: results.provinces.length + results.districts.length,
                    results: {
                        provinces: results.provinces,
                        districts: results.districts
                    }
                }
            });
        } catch (error) {
            console.error('Error in searchLocations:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy thông tin chi tiết province theo code
     * GET /api/locations/provinces/:provinceCode
     */
    static async getProvinceDetails(req, res) {
        try {
            const { provinceCode } = req.params;
            
            if (!provinceCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Province code is required'
                });
            }
            
            const province = await LocationModel.getProvinceByCode(provinceCode);
            
            if (!province) {
                return res.status(404).json({
                    success: false,
                    message: 'Province not found'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Province details retrieved successfully',
                data: {
                    province
                }
            });
        } catch (error) {
            console.error('Error in getProvinceDetails:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy thông tin chi tiết district theo code
     * GET /api/locations/districts/:districtCode
     */
    static async getDistrictDetails(req, res) {
        try {
            const { districtCode } = req.params;
            
            if (!districtCode) {
                return res.status(400).json({
                    success: false,
                    message: 'District code is required'
                });
            }
            
            const district = await LocationModel.getDistrictByCode(districtCode);
            
            if (!district) {
                return res.status(404).json({
                    success: false,
                    message: 'District not found'
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'District details retrieved successfully',
                data: {
                    district
                }
            });
        } catch (error) {
            console.error('Error in getDistrictDetails:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy auto suggestion cho location search
     * GET /api/locations/suggestions?q=...&limit=10
     * API này tối ưu cho auto complete: trả về format đơn giản hơn
     */
    static async getLocationSuggestions(req, res) {
        try {
            const { q: searchTerm, limit = 10 } = req.query;
            
            if (!searchTerm || searchTerm.trim().length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No search term provided',
                    data: {
                        suggestions: []
                    }
                });
            }

            if (searchTerm.trim().length < 2) {
                return res.status(200).json({
                    success: true,
                    message: 'Search term too short',
                    data: {
                        suggestions: []
                    }
                });
            }
            
            const results = await LocationModel.searchLocations(searchTerm, parseInt(limit));
            
            // Format đơn giản cho auto suggestion
            const suggestions = [];
            
            // Thêm provinces
            results.provinces.forEach(province => {
                suggestions.push({
                    id: province.code,
                    type: 'province',
                    name: province.Name,
                    nameEn: province.NameEn,
                    fullName: province.FullName,
                    displayText: province.Name,
                    secondaryText: 'Tỉnh/Thành phố'
                });
            });
            
            // Thêm districts
            results.districts.forEach(district => {
                suggestions.push({
                    id: district.code,
                    type: 'district', 
                    name: district.Name,
                    nameEn: district.NameEn,
                    fullName: district.FullName,
                    provinceCode: district.ProvinceCode,
                    provinceName: district.ProvinceName,
                    displayText: district.Name,
                    secondaryText: `${district.ProvinceName || 'N/A'}`
                });
            });
            
            return res.status(200).json({
                success: true,
                message: 'Location suggestions retrieved successfully',
                data: {
                    searchTerm,
                    total: suggestions.length,
                    suggestions
                }
            });
        } catch (error) {
            console.error('Error in getLocationSuggestions:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy top locations phổ biến để preload
     * GET /api/locations/popular?limit=20
     */
    static async getPopularLocations(req, res) {
        try {
            const { limit = 20 } = req.query;
            
            const results = await LocationModel.getPopularLocations(parseInt(limit));
            
            // Format cho auto suggestion giống getLocationSuggestions
            const suggestions = [];
            
            // Thêm provinces
            results.provinces.forEach(province => {
                suggestions.push({
                    id: province.code,
                    type: 'province',
                    name: province.Name,
                    nameEn: province.NameEn,
                    fullName: province.FullName,
                    displayText: province.Name,
                    secondaryText: 'Tỉnh',
                    productCount: province.ProductCount
                });
            });
            
            // Thêm districts
            results.districts.forEach(district => {
                suggestions.push({
                    id: district.code,
                    type: 'district', 
                    name: district.Name,
                    nameEn: district.NameEn,
                    fullName: district.FullName,
                    provinceCode: district.ProvinceCode,
                    provinceName: district.ProvinceName,
                    displayText: district.Name,
                    secondaryText: 'Thành phố',
                    productCount: district.ProductCount
                });
            });
            
            return res.status(200).json({
                success: true,
                message: 'Popular locations retrieved successfully',
                data: {
                    total: suggestions.length,
                    limit: parseInt(limit),
                    suggestions
                }
            });
        } catch (error) {
            console.error('Error in getPopularLocations:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = LocationController;
