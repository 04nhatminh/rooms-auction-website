const pool = require('../config/database');
const { MongoClient } = require('mongodb');

class ProductModel {
    // Initialize MongoDB connection when class is loaded
    static async initMongo() {
        try {
            const client = await MongoClient.connect('mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/');
            this.mongoDb = client.db('a2airbnb');
            console.log('MongoDB connected successfully');
        } catch (err) {
            console.error("MongoDB connection failed:", err);
        }
    }

    static async getProductDetails(productUID) 
    {
        try {
            const query = 'SELECT * FROM products WHERE UID = ?';
            const [products] = await pool.execute(query, [productUID]);
            console.log(`Fetched product details for ProductID ${productUID}:`, products);
            return products[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product details:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    static async getProductAmenities(productID) {
        try {
            const query = `
                SELECT 
                    a.AmenityID,
                    a.AmenityName,
                    a.AmenityImageURL
                FROM 
                    ProductAmenities pa
                JOIN 
                    Amenities a ON pa.AmenityID = a.AmenityID
                WHERE 
                    pa.ProductID = ?
            `;
            const [amenities] = await pool.execute(query, [productID]);
            console.log(`Fetched amenities for ProductID ${productID}:`, amenities);
            return amenities;
        } catch (error) {
            console.error('Error fetching product amenities:', error);
            throw error;
        }
    }

    static async getProductDescription(productID) {

        // Step 2: Fetch matching document from MongoDB
        const collection = this.mongoDb.collection('descriptions');
        const matchingDoc = await collection.findOne({ ProductID: productID });

        if (!matchingDoc) {
        return { success: false, message: 'No description found in MongoDB' };
        }

        // Step 3: Return the MongoDB document

        console.log(`Found description in MongoDB for ExternalID ${productID}`);
        console.log(`Description: ${matchingDoc.Descriptions}`);

        return matchingDoc.Descriptions;

    }

    static async getProductReviews(productID) {

        // Step 2: Fetch matching document from MongoDB
        const collection = this.mongoDb.collection('reviews');
        const matchingDoc = await collection.findOne({ ProductID: productID });

        if (!matchingDoc) {
        return { success: false, message: 'No reviews found in MongoDB' };
        }

        // Step 3: Return the MongoDB document

        console.log(`Found reviews in MongoDB for ExternalID ${productID}`);

        console.log(`Reviews:`, matchingDoc);
        return matchingDoc;

    }

    static async getProductImages(productID) {

        // Step 2: Fetch matching document from MongoDB
        const collection = this.mongoDb.collection('images');
        const matchingDoc = await collection.findOne({ ProductID: productID });

        if (!matchingDoc) {
        return { success: false, message: 'No images found in MongoDB' };
        }

        // Step 3: Return the MongoDB document

        console.log(`Found images in MongoDB for ExternalID ${productID}`);
        console.log(`Images: ${matchingDoc.Images}`);

        return matchingDoc.Images || []; // Trả về mảng hình ảnh, nếu không có thì trả về mảng rỗng

    }

    static async getProductPolicies(productID) {

        // Step 2: Fetch matching document from MongoDB
        const collection = this.mongoDb.collection('policies');
        const matchingDoc = await collection.findOne({ ProductID: productID });

        if (!matchingDoc) {
        return { success: false, message: 'No policies found in MongoDB' };
        }

        // Step 3: Return the MongoDB document

        console.log(`Found policies in MongoDB for ExternalID ${productID}`);
        console.log(`Policy: ${matchingDoc.Policies}`);

        return matchingDoc.Policies || []; // Trả về mảng hình ảnh, nếu không có thì trả về mảng rỗng

    }

    static async getProductProvinceName(productID) 
    {
        try {
                const query = `
                SELECT 
                    pa.Name 
                FROM 
                    Provinces pa
                JOIN 
                    Products pr ON pr.ProvinceCode = pa.ProvinceCode
                WHERE 
                    pr.ProductID = ?
            `;
                const [provinceName] = await pool.execute(query, [productID]);
                console.log(`Fetched product province for ProductID ${productID}:`, provinceName);
                return provinceName[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product province:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    static async getProductDistrictName(productID) 
    {
        try {
                const query = `
                SELECT 
                    d.Name 
                FROM 
                    Districts d
                JOIN 
                    Products p ON p.DistrictCode = d.DistrictCode
                WHERE 
                    p.ProductID = ?
            `;
                const [districtName] = await pool.execute(query, [productID]);
                console.log(`Fetched product district for ProductID ${productID}:`, districtName);
                return districtName[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product district:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    static async getProductPropertyTypeName(productID) 
    {
        try {
                const query = `
                SELECT 
                    prop.PropertyName as Name
                FROM 
                    Properties prop
                JOIN 
                    Products p ON p.PropertyType = prop.PropertyID
                WHERE 
                    p.ProductID = ?
            `;
                const [property] = await pool.execute(query, [productID]);
                console.log(`Fetched product property name for ProductID ${productID}:`, property);
                return property[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product property name:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }


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

    // Lấy top products theo điểm trung bình cao nhất trong một district
    static async getTopRatedProductsByDistrict(districtCode, limit = 15) {
        try {
            // Validate inputs
            if (!districtCode || typeof districtCode !== 'string') {
                throw new Error('Invalid districtCode');
            }
            
            const numLimit = parseInt(limit);
            if (isNaN(numLimit) || numLimit <= 0 || numLimit > 100) {
                throw new Error('Invalid limit');
            }
            
            // Gọi stored procedure
            const [rows] = await pool.execute(
                'CALL GetTopProductsByDistrict(?, ?)', 
                [districtCode, numLimit]
            );
            
            // MySQL stored procedure trả về array of arrays, lấy result set đầu tiên
            const products = Array.isArray(rows[0]) ? rows[0] : rows;
            
            console.log('Stored procedure result count:', products.length);
            return products;
            
        } catch (error) {
            console.error('Error in getTopRatedProductsByDistrict:', error);
            throw error;
        }
    }

    // Lấy danh sách tất cả sản phẩm cho admin
    static async getAllProductsForAdmin(limit, offset) 
    {
        try {
            const query = `
                SELECT 
                    p.ProductID,
                    p.UID,
                    p.Name as productName,
                    ppt.PropertyName as propertyTypeName,
                    d.Name as districtName,
                    pr.Name as provinceName,
                    p.Price,
                    p.Source
                FROM Products p
                JOIN Properties ppt ON p.PropertyType = ppt.PropertyID
                JOIN Districts d ON p.DistrictCode = d.DistrictCode
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                WHERE p.is_deleted = 0
                ORDER BY p.ProductID ASC
                LIMIT ${limit} OFFSET ${offset}
            `;
            const [products] = await pool.execute(query, [limit, offset]);
            return products;
        } catch (error) {
            console.error('Error fetching all products for admin:', error);
            throw error;
        }
    }

    // Tạo sản phẩm mới
    static async createProduct(data) {
        const {
            name, roomNumber, bedrooms, bathrooms, description,
            region, provinceCode, districtCode, propertyType, amenities, images, price, currency
        } = data;
        const pool = require('../config/database');
        const uid = parseInt(Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
        const insertQuery = `
            INSERT INTO Products (
                UID, 
                Name, 
                Address, 
                ProvinceCode, 
                DistrictCode,
                NumBedrooms, 
                NumBathrooms, 
                PropertyType, 
                Price,
                Currency,
                CreatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await pool.execute(insertQuery, [
            uid, 
            name, 
            roomNumber || '', 
            provinceCode, 
            districtCode || null,
            bedrooms || 1, 
            bathrooms || 1, 
            propertyType || 1,
            price || 0,
            currency || 'VND'
        ]);
        return { id: result.insertId, uid };
    }

    // Cập nhật sản phẩm
    static async updateProduct(id, updateData) {
        // Ví dụ chỉ update tên, có thể mở rộng thêm các trường khác
        const pool = require('../config/database');
        const updateQuery = 'UPDATE Products SET Name = ? WHERE ProductID = ?';
        await pool.execute(updateQuery, [updateData.name, id]);
        return { id };
    }

    // Xóa sản phẩm (xóa mềm)
    static async deleteProduct(id) {
        const pool = require('../config/database');
        const softDeleteQuery = `UPDATE Products SET is_deleted = 1 WHERE ProductID = ?`;
        const [result] = await pool.execute(softDeleteQuery, [id]);
        return result.affectedRows;
    }

    // Tìm kiếm sản phẩm theo UID cho admin
    static async searchProductsByUID(uid, limit, offset) {
        try {
            const safeLimit = Number.parseInt(limit, 10) || 20;
            const safeOffset = Number.parseInt(offset, 10) || 0;

            // Search for products with UID containing the search term
            const searchQuery = `
                SELECT 
                    p.ProductID,
                    p.UID,
                    p.Name as productName,
                    ppt.PropertyName as propertyTypeName,
                    d.Name as districtName,
                    pr.Name as provinceName,
                    p.Price,
                    p.Source
                FROM Products p
                JOIN Properties ppt ON p.PropertyType = ppt.PropertyID
                JOIN Districts d ON p.DistrictCode = d.DistrictCode
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                WHERE p.is_deleted = 0 AND p.UID LIKE ?
                ORDER BY p.ProductID ASC
                LIMIT ${safeLimit} OFFSET ${safeOffset}
            `;
            
            const countQuery = `
                SELECT COUNT(*) as total
                FROM Products p
                WHERE p.is_deleted = 0 AND p.UID LIKE ?
            `;
            
            const searchTerm = `%${uid}%`;
            
            // Get both results and count
            const [products] = await pool.execute(searchQuery, [searchTerm]);
            const [countResult] = await pool.execute(countQuery, [searchTerm]);
            
            return {
                products,
                total: countResult[0].total
            };
        } catch (error) {
            console.error('Error searching products by UID:', error);
            throw error;
        }
    }

    // Lấy danh sách property types từ bảng Properties
    static async getAllPropertyTypes() {
        try {
            const query = 'SELECT PropertyID, PropertyName FROM Properties ORDER BY PropertyID ASC';
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error fetching property types:', error);
            throw error;
        }
    }
}

// Initialize MongoDB connection when module is loaded
ProductModel.initMongo();

module.exports = ProductModel;
