const pool = require('../config/database');
const { MongoClient } = require('mongodb');

function sanitizeString(s) {
  return (typeof s === 'string') ? s.trim() : s;
}
function toInt(n, def = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : def;
}
function toPrice(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

class ProductModel {
    // Initialize MongoDB connection when class is loaded
    static async initMongo() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/';
            const client = await MongoClient.connect(mongoUri);
            this.mongoDb = client.db('a2airbnb');
            console.log('MongoDB connected successfully');
        } catch (err) {
            console.error("MongoDB connection failed:", err);
        }
    }


    static generateSnowflakeKey() {
        if (!this.lastTimestamp) this.lastTimestamp = 0;
        if (!this.sequence) this.sequence = 0;

        const machineId = 1; // 10 bits
        let timestamp = Date.now();

        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1) & 0xfff; // 12 bits
            if (this.sequence === 0) {
            while (Date.now() <= this.lastTimestamp) {}
            timestamp = Date.now();
            }
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;

        const snowflake = (BigInt(timestamp) << 22n) |
                            (BigInt(machineId) << 12n) |
                            BigInt(this.sequence);
        return snowflake.toString();
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

    // Lấy danh sách room types từ bảng RoomTypes
    static async getAllRoomTypes() {
        try {
            const query = 'SELECT RoomTypeID, RoomTypeName FROM RoomTypes ORDER BY RoomTypeID ASC';
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error fetching room types:', error);
            throw error;
        }
    }

    // Lấy danh sách amenity groups từ bảng AmenityGroups
    static async getAllAmenityGroups() {
        try {
            const query = 'SELECT AmenityGroupID, AmenityGroupName FROM AmenityGroups ORDER BY AmenityGroupID ASC';
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error fetching amenity groups:', error);
            throw error;
        }
    }

    // Lấy danh sách amenities từ bảng Amenities
    static async getAllAmenities() {
        try {
            const query = 'SELECT AmenityID, AmenityName, AmenityGroupID FROM Amenities ORDER BY AmenityID ASC';
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error fetching amenities:', error);
            throw error;
        }
    }

    // ==================================================================================
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

    //===========================================================================
    // Tạo sản phẩm mới
    static async addProduct(data) {
        // 1) Chuẩn hoá / ép kiểu
        const name           = sanitizeString(data.name);
        const roomType       = toInt(data.roomType, null);
        const propertyType   = toInt(data.propertyType, null);
        const bedrooms       = toInt(data.bedrooms, 0);
        const beds           = toInt(data.beds, 0);
        const bathrooms      = toInt(data.bathrooms, 0);
        const maxGuests      = toInt(data.maxGuests, 1);
        const price          = toPrice(data.price);
        const provinceCode   = sanitizeString(data.provinceCode);
        const districtCode   = sanitizeString(data.districtCode);
        const address        = sanitizeString(data.address);
        const amenities      = Array.isArray(data.amenities) ? data.amenities.map(a => toInt(a)).filter(Number.isFinite) : [];
        const descriptions   = Array.isArray(data.descriptions) ? data.descriptions : [];
        const houseRules     = Array.isArray(data.houseRules) ? data.houseRules.filter(x => x && x.trim()) : [];
        const safetyProps    = Array.isArray(data.safetyProperties) ? data.safetyProperties.filter(x => x && x.trim()) : [];
        // const images      = Array.isArray(data.images) ? data.images : []; // hiện chưa lưu

        // Validate tối thiểu
        if (!name || !address || !provinceCode || !districtCode || !propertyType || !roomType || !Number.isFinite(price)) {
            throw new Error('Thiếu hoặc dữ liệu không hợp lệ cho trường bắt buộc');
        }

        const uid = this.generateSnowflakeKey();
        console.log('Generated UID:', uid);
        const now = new Date();

        const insertQuery = `
        INSERT INTO Products
        (
            UID, Source, ExternalID, Name, Address, ProvinceCode, DistrictCode,
            Latitude, Longitude, PropertyType, RoomType, MaxGuests, NumBedrooms, NumBeds, NumBathrooms,
            Price, Currency, CleanlinessPoint, LocationPoint, ServicePoint, ValuePoint,
            CommunicationPoint, ConveniencePoint, CreatedAt, LastSyncedAt
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        const insertParams = [
            uid,
            'bidstay',           // Source mặc định
            null,                // ExternalID
            name,
            address,
            provinceCode,
            districtCode,
            null,                // Latitude (tạm)
            null,                // Longitude (tạm)
            propertyType,
            roomType,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            price,
            'VND',               // Currency mặc định
            0, 0, 0, 0, 0, 0,    // *Point = 0
            now,                 // CreatedAt
            now                  // LastSyncedAt
        ];

        let conn;
        let productId;

        try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 2) Insert Products
        const [result] = await conn.execute(insertQuery, insertParams);
        productId = result.insertId;

        // 3) Bulk insert amenities (nếu có)
        if (amenities.length > 0) {
            const placeholders = amenities.map(() => '(?, ?)').join(', ');
            const flatParams = amenities.flatMap(aid => [productId, aid]);
            const sqlAmen = `INSERT INTO ProductAmenities (ProductID, AmenityID) VALUES ${placeholders}`;
            await conn.execute(sqlAmen, flatParams);
        }

        // OK -> commit MySQL
        await conn.commit();
        } catch (err) {
        if (conn) await conn.rollback();
        throw err;
        } finally {
        if (conn) conn.release();
        }

        // 4) Ghi Mongo sau commit (không để chặn transaction MySQL)
        try {
            if (descriptions.length) {
                await this.mongoDb.collection('descriptions').insertOne({
                ProductID: productId,
                Source: 'bidstay',
                Descriptions: descriptions.map(d => ({
                    title: d.title ?? null,
                    htmlText: d.htmlText ?? ''
                })),
                updated_at: new Date()
                });
            }

            if (houseRules.length || safetyProps.length) {
                await this.mongoDb.collection('policies').insertOne({
                ProductID: productId,
                Source: 'bidstay',
                Policies: {
                    house_rules: houseRules,
                    safety_properties: safetyProps,
                    house_rules_subtitle: 'Vui lòng tuân thủ nội quy của chủ nhà.'
                },
                updated_at: new Date()
                });
            }
        } catch (mongoErr) {
        console.error('[Mongo insert error]', mongoErr);
        }

        return productId;
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




}

// Initialize MongoDB connection when module is loaded
ProductModel.initMongo();

module.exports = ProductModel;
