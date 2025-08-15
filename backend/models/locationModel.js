const pool = require('../config/database');

class LocationModel {
    // Lấy top locations phổ biến (provinces + districts có nhiều products)
    // @param {number} limit - Giới hạn số kết quả trả về
    // @returns {Object} Object chứa top provinces và districts
    static async getPopularLocations(limit = 20) {
        try {
            const provinceLimit = Math.floor(limit * 0.6); // 60% provinces
            const districtLimit = Math.ceil(limit * 0.4);  // 40% districts
            
            const [topProvinces] = await pool.execute('CALL GetPopularProvinces(?)', [provinceLimit]);
            const [topDistricts] = await pool.execute('CALL GetPopularDistricts(?)', [districtLimit]);

            return {
                provinces: topProvinces[0] || [], // Lấy data từ index 0
                districts: topDistricts[0] || []  // Lấy data từ index 0
            };
        } catch (error) {
            console.error('Error in getPopularLocations:', error);
            throw error;
        }
    }

    // Tìm kiếm locations (cả provinces và districts) theo từ khóa
    // @param {string} searchTerm - Từ khóa tìm kiếm
    // @param {number} limit - Giới hạn số kết quả trả về
    // @returns {Object} Object chứa provinces và districts matching
    static async searchLocations(searchTerm, limit = 20) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                return { provinces: [], districts: [] };
            }

            const searchPattern = `%${searchTerm.trim()}%`;
            
            // Tìm provinces
            const [provinces] = await pool.execute('CALL SearchProvinces(?, ?, ?, ?, ?, ?, ?, ?)', [
                searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
                `${searchTerm.trim()}%`, `${searchTerm.trim()}%`,
                Math.floor(limit / 2)
            ]);

            // Tìm districts
            const [districts] = await pool.execute('CALL SearchDistricts(?, ?, ?, ?, ?, ?, ?, ?)', [
                searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
                `${searchTerm.trim()}%`, `${searchTerm.trim()}%`,
                Math.floor(limit / 2)
            ]);

            return {
                provinces,
                districts
            };
        } catch (error) {
            console.error('Error in searchLocations:', error);
            throw error;
        }
    }

    // Lấy tất cả provinces cho auto suggestion
    // @param {string} searchTerm - Từ khóa tìm kiếm (không bắt buộc)
    // @param {number} limit - Giới hạn số kết quả trả về
    // @returns {Array} Danh sách provinces
    static async getAllProvinces() {
        try {
            const [rows] = await pool.execute('CALL GetAllProvinces()');
            return rows[0] || []; // Lấy data từ index 0 như các stored procedure khác
        } catch (error) {
            console.error('Error in getAllProvinces:', error);
            throw error;
        }
    }

    static async getAllDistricts() {
        try {
            const [rows] = await pool.execute('CALL GetAllDistricts()');
            return rows[0] || []; // Lấy data từ index 0 như các stored procedure khác
        } catch (error) {
            console.error('Error in getAllDistricts:', error);
            throw error;
        }
    }

    // Lấy tất cả districts theo province code
    // @param {string} provinceCode - Mã tỉnh/thành phố
    // @param {string} searchTerm - Từ khóa tìm kiếm (không bắt buộc)
    // @param {number} limit - Giới hạn số kết quả trả về
    // @returns {Array} Danh sách districts
    static async getDistrictsByProvince(provinceCode, searchTerm = null, limit = 100) {
        try {
            let query = `
                SELECT 
                    d.DistrictCode,
                    d.Name,
                    d.NameEn,
                    d.FullName,
                    d.FullNameEn,
                    d.CodeName,
                    d.ProvinceCode,
                    p.Name AS ProvinceName,
                    p.NameEn AS ProvinceNameEn
                FROM Districts d
                LEFT JOIN Provinces p ON d.ProvinceCode = p.ProvinceCode
                WHERE d.ProvinceCode = ?
            `;
            
            let queryParams = [provinceCode];
            
            // Thêm điều kiện tìm kiếm nếu có searchTerm
            if (searchTerm && searchTerm.trim().length > 0) {
                query += ` 
                AND (
                    d.Name LIKE ? OR 
                    d.NameEn LIKE ? OR 
                    d.FullName LIKE ? OR 
                    d.FullNameEn LIKE ? OR 
                    d.CodeName LIKE ?
                )
                `;
                const searchPattern = `%${searchTerm.trim()}%`;
                queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            }
            
            query += ` ORDER BY d.Name ASC LIMIT ?`;
            queryParams.push(parseInt(limit));
            
            const [rows] = await pool.execute(query, queryParams);
            return rows;
        } catch (error) {
            console.error('Error in getDistrictsByProvince:', error);
            throw error;
        }
    }

    // Lấy thông tin chi tiết của một province theo code
    // @param {string} provinceCode - Mã tỉnh/thành phố
    // @returns {Object|null} Thông tin province
    static async getProvinceByCode(provinceCode) {
        try {
            const query = `
                SELECT 
                    ProvinceCode,
                    Name,
                    NameEn,
                    FullName,
                    FullNameEn,
                    CodeName,
                    AdministrativeUnitID,
                    AdministrativeRegionID
                FROM Provinces
                WHERE ProvinceCode = ?
            `;
            
            const [rows] = await pool.execute(query, [provinceCode]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getProvinceByCode:', error);
            throw error;
        }
    }

    // Lấy thông tin chi tiết của một district theo code
    // @param {string} districtCode - Mã quận/huyện
    // @returns {Object|null} Thông tin district
    static async getDistrictByCode(districtCode) {
        try {
            const query = `
                SELECT 
                    d.DistrictCode,
                    d.Name,
                    d.NameEn,
                    d.FullName,
                    d.FullNameEn,
                    d.CodeName,
                    d.ProvinceCode,
                    d.AdministrativeUnitID,
                    p.Name AS ProvinceName,
                    p.NameEn AS ProvinceNameEn
                FROM Districts d
                LEFT JOIN Provinces p ON d.ProvinceCode = p.ProvinceCode
                WHERE d.DistrictCode = ?
            `;
            
            const [rows] = await pool.execute(query, [districtCode]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getDistrictByCode:', error);
            throw error;
        }
    }
}

module.exports = LocationModel;
