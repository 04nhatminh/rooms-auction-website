const pool = require('../config/database');

class ProductModel {
    // Lấy top products theo điểm trung bình cao nhất trong một province
    static async getTopRatedProductsByProvince(provinceCode, limit = 15) {
        try {
            // Validate inputs
            if (!provinceCode || typeof provinceCode !== 'string') {
                throw new Error('Invalid provinceCode');
            }
            
            const numLimit = parseInt(limit);
            if (isNaN(numLimit) || numLimit <= 0 || numLimit > 100) {
                throw new Error('Invalid limit');
            }
            
            // Gọi stored procedure
            const [rows] = await pool.execute(
                'CALL GetTopProductsByProvince(?, ?)', 
                [provinceCode, numLimit]
            );
            
            // MySQL stored procedure trả về array of arrays, lấy result set đầu tiên
            const products = Array.isArray(rows[0]) ? rows[0] : rows;
            
            console.log('Stored procedure result count:', products.length);
            return products;
            
        } catch (error) {
            console.error('Error in getTopRatedProductsByProvince:', error);            
            throw error;
        }
    }

    /**
     * Lấy thông tin chi tiết một product theo ID
     * @param {number} productId - ID của product
     * @returns {Object} Thông tin chi tiết product
     */
    static async getProductById(productId) {
        try {
            const query = `
                SELECT 
                    p.*,
                    prop.PropertyName,
                    prop.PropertyImageURL,
                    rt.RoomTypeName,
                    rt.RoomTypeImageURL,
                    prov.Name AS ProvinceName,
                    prov.NameEn AS ProvinceNameEn,
                    dist.Name AS DistrictName,
                    dist.NameEn AS DistrictNameEn,
                    ROUND(
                        (COALESCE(p.CleanlinessPoint, 0) + 
                         COALESCE(p.LocationPoint, 0) + 
                         COALESCE(p.ServicePoint, 0) + 
                         COALESCE(p.ValuePoint, 0) + 
                         COALESCE(p.CommunicationPoint, 0) + 
                         COALESCE(p.ConveniencePoint, 0)) / 6, 2
                    ) AS AverageRating
                FROM Products p
                LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
                WHERE p.ProductID = ?
            `;

            const [rows] = await pool.execute(query, [productId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getProductById:', error);
            throw error;
        }
    }

    /**
     * Lấy amenities của một product
     * @param {number} productId - ID của product
     * @returns {Array} Danh sách amenities
     */
    static async getProductAmenities(productId) {
        try {
            const query = `
                SELECT 
                    a.AmenityID,
                    a.AmenityName,
                    a.AmenityImageURL,
                    ag.AmenityGroupID,
                    ag.AmenityGroupName
                FROM ProductAmenities pa
                JOIN Amenities a ON pa.AmenityID = a.AmenityID
                LEFT JOIN AmenityGroups ag ON a.AmenityGroupID = ag.AmenityGroupID
                WHERE pa.ProductID = ?
                ORDER BY ag.AmenityGroupName, a.AmenityName
            `;

            const [rows] = await pool.execute(query, [productId]);
            return rows;
        } catch (error) {
            console.error('Error in getProductAmenities:', error);
            throw error;
        }
    }

    /**
     * Lấy danh sách provinces có products
     * @returns {Array} Danh sách provinces
     */
    static async getProvincesWithProducts() {
        try {
            const query = `
                SELECT DISTINCT
                    p.ProvinceCode,
                    prov.Name AS ProvinceName,
                    prov.NameEn AS ProvinceNameEn,
                    COUNT(p.ProductID) AS ProductCount
                FROM Products p
                JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                GROUP BY p.ProvinceCode, prov.Name, prov.NameEn
                ORDER BY ProductCount DESC, prov.Name
            `;

            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error in getProvincesWithProducts:', error);
            throw error;
        }
    }
}

module.exports = ProductModel;
