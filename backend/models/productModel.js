const e = require('express');
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
            const query = `SELECT p.*, pr.FullName AS ProvinceFullName, d.FullName AS DistrictFullName
                            FROM Products p 
                            JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                            JOIN Districts d ON p.DistrictCode = d.DistrictCode
                            WHERE p.UID = ?`;
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

    static async getRoomTourImages(productID) {
        // Step 2: Fetch matching document from MongoDB
        const collection = this.mongoDb.collection('room_tour_images');
        const matchingDoc = await collection.findOne({ ProductID: productID });

        if (!matchingDoc) {
            return { success: false, message: 'No room tour images found in MongoDB' };
        }

        // Step 3: Return the MongoDB document

        console.log(`Found room tour images in MongoDB for ExternalID ${productID}`);
        console.log(`Room Tour Images: ${matchingDoc.RoomTourItems}`);

        return matchingDoc.RoomTourItems || []; // Trả về mảng hình ảnh, nếu không có thì trả về mảng rỗng

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
        const safeLimit = parseInt(limit, 10);
        const safeOffset = parseInt(offset, 10);
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
                LEFT JOIN Properties ppt ON p.PropertyType = ppt.PropertyID
                LEFT JOIN Districts d ON p.DistrictCode = d.DistrictCode
                LEFT JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                WHERE p.is_deleted = 0
                ORDER BY p.ProductID ASC
                LIMIT ${safeLimit} OFFSET ${safeOffset}
            `;
            const [products] = await pool.execute(query);
            return products;
        } catch (error) {
            console.error('Error fetching all products for admin:', error);
            throw error;
        }
    }

    // Tìm kiếm sản phẩm theo UID cho admin
    static async searchProductsByUID(uid, limit, offset) {
        try {
            const safeLimit = Number.parseInt(limit, 10) || 10;
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
                LEFT JOIN Properties ppt ON p.PropertyType = ppt.PropertyID
                LEFT JOIN Districts d ON p.DistrictCode = d.DistrictCode
                LEFT JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
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
        const latitude       = parseFloat(data.latitude);
        const longitude      = parseFloat(data.longitude);
        const amenities      = Array.isArray(data.amenities) ? data.amenities.map(a => toInt(a)).filter(Number.isFinite) : [];
        const descriptions   = Array.isArray(data.descriptions) ? data.descriptions : [];
        const houseRules     = Array.isArray(data.houseRules) ? data.houseRules.filter(x => x && x.trim()) : [];
        const safetyProps    = Array.isArray(data.safetyProperties) ? data.safetyProperties.filter(x => x && x.trim()) : [];

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
            latitude,
            longitude,
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
    static async updateProduct(uid, updateData) {
        // 1) Chuẩn hoá / ép kiểu
        const name           = sanitizeString(updateData.name);
        const roomType       = toInt(updateData.roomType, null);
        const propertyType   = toInt(updateData.propertyType, null);
        const bedrooms       = toInt(updateData.bedrooms, 0);
        const beds           = toInt(updateData.beds, 0);
        const bathrooms      = toInt(updateData.bathrooms, 0);
        const maxGuests      = toInt(updateData.maxGuests, 1);
        const price          = toPrice(updateData.price);
        const provinceCode   = sanitizeString(updateData.provinceCode);
        const districtCode   = sanitizeString(updateData.districtCode);
        const address        = sanitizeString(updateData.address);
        const latitude       = parseFloat(updateData.latitude);
        const longitude      = parseFloat(updateData.longitude);
        // updateData.amenities = [24, 47, 48]
        const amenities      = Array.isArray(updateData.amenities) ? updateData.amenities.map(a => toInt(a)).filter(Number.isFinite) : [];
        const descriptions   = Array.isArray(updateData.descriptions) ? updateData.descriptions : [];
        const houseRules     = Array.isArray(updateData.houseRules) ? updateData.houseRules.filter(x => x && x.trim()) : [];
        const safetyProps    = Array.isArray(updateData.safetyProperties) ? updateData.safetyProperties.filter(x => x && x.trim()) : [];

        // Validate tối thiểu
        if (!name || !address || !provinceCode || !districtCode || !propertyType || !roomType || !Number.isFinite(price)) {
            throw new Error('Thiếu hoặc dữ liệu không hợp lệ cho trường bắt buộc');
        }

        const now = new Date();

        const updateQuery = `
        UPDATE Products
        SET
            Name = ?,
            Address = ?,
            ProvinceCode = ?,
            DistrictCode = ?,
            Latitude = ?,
            Longitude = ?,
            PropertyType = ?,
            RoomType = ?,
            MaxGuests = ?,
            NumBedrooms = ?,
            NumBeds = ?,
            NumBathrooms = ?,
            Price = ?,
            Currency = ?,
            LastSyncedAt = ?
        WHERE UID = ?
        `;

        const updateParams = [
            name,
            address,
            provinceCode,
            districtCode,
            latitude,
            longitude,
            propertyType,
            roomType,
            maxGuests,
            bedrooms,
            beds,
            bathrooms,
            price,
            'VND',               // Currency mặc định
            now,                 // LastSyncedAt
            uid
        ];

        const [result] = await pool.query(updateQuery, updateParams);
        if (result.affectedRows === 0) {
            throw new Error('Cập nhật sản phẩm không thành công');
        }

        // Lấy ProductID để cập nhật các collections khác
        const productId = await this.findProductIdByUID(uid);
        if (!productId) {
            throw new Error('Không tìm thấy ProductID cho UID này');
        }

        // Cập nhật amenities (MySQL)
        if (amenities && amenities.length >= 0) {
            await this.updateProductAmenities(productId, amenities);
        }

        // Cập nhật descriptions (MongoDB)
        if (descriptions && descriptions.length > 0) {
            await this.updateProductDescriptions(productId, descriptions);
        }

        // Cập nhật policies (MongoDB) 
        if (houseRules.length > 0 || safetyProps.length > 0) {
            await this.updateProductPolicies(productId, houseRules, safetyProps);
        }

        console.log(`Product ${uid} updated successfully`);
    }

    static async findProductIdByUID(uid) {
        const [rows] = await pool.query(
        `SELECT ProductID FROM Products WHERE UID = ? LIMIT 1`,
        [uid]
        );
        return rows[0]?.ProductID || null;
    }

    // Cập nhật amenities cho sản phẩm (MySQL)
    static async updateProductAmenities(productId, amenityIds) {
        try {
            // Xóa tất cả amenities cũ
            await pool.query('DELETE FROM ProductAmenities WHERE ProductID = ?', [productId]);
            
            // Thêm amenities mới
            if (amenityIds && amenityIds.length > 0) {
                const insertValues = amenityIds.map(amenityId => [productId, amenityId]);
                const insertQuery = 'INSERT INTO ProductAmenities (ProductID, AmenityID) VALUES ?';
                await pool.query(insertQuery, [insertValues]);
            }
            
            console.log(`Updated amenities for ProductID ${productId}: ${amenityIds.length} items`);
        } catch (error) {
            console.error('Error updating product amenities:', error);
            throw error;
        }
    }

    // Cập nhật descriptions cho sản phẩm (MongoDB)
    static async updateProductDescriptions(productId, descriptions) {
        try {
            if (!this.mongoDb) {
                throw new Error('MongoDB connection not available');
            }

            const collection = this.mongoDb.collection('descriptions');
            console.log(`Updating descriptions for ProductID ${productId}: ${descriptions.length} items`);

            // Xóa descriptions cũ
            await collection.deleteOne({ ProductID: productId });
            
            // Thêm descriptions mới nếu có
            if (descriptions && descriptions.length > 0) {
                const descriptionsData = {
                    ProductID: productId,
                    Source: 'bidstay',
                    Descriptions: descriptions.map(desc => ({
                        title: desc.title || null,
                        htmlText: desc.htmlText || ''
                    })),
                    updated_at: new Date()
                };
                
                await collection.insertOne(descriptionsData);
            }
            
            console.log(`Updated descriptions for ProductID ${productId}: ${descriptions.length} items`);
        } catch (error) {
            console.error('Error updating product descriptions:', error);
            throw error;
        }
    }

    // Cập nhật policies cho sản phẩm (MongoDB)
    static async updateProductPolicies(productId, houseRules, safetyProperties) {
        try {
            if (!this.mongoDb) {
                throw new Error('MongoDB connection not available');
            }

            const collection = this.mongoDb.collection('policies');
            
            // Xóa policies cũ
            await collection.deleteOne({ ProductID: productId });
            
            // Thêm policies mới
            const policiesData = {
                ProductID: productId,
                Source: 'bidstay',
                Policies: {
                    house_rules: houseRules || [],
                    safety_properties: safetyProperties || []
                },
                updated_at: new Date()
            };
            
            await collection.insertOne(policiesData);
            
            console.log(`Updated policies for ProductID ${productId}: ${houseRules.length} house rules, ${safetyProperties.length} safety properties`);
        } catch (error) {
            console.error('Error updating product policies:', error);
            throw error;
        }
    }

    // Cập nhật room tour images (MongoDB) 
    static async updateRoomTourImages(productId, roomTourData) {
        try {
            if (!this.mongoDb) {
                throw new Error('MongoDB connection not available');
            }

            const collection = this.mongoDb.collection('room_tour_images');
            
            // Xóa room tour cũ
            await collection.deleteOne({ ProductID: productId });
            
            // Thêm room tour mới nếu có
            if (roomTourData && roomTourData.length > 0) {
                const tourData = {
                    ProductID: productId,
                    Source: 'bidstay',
                    RoomTourItems: roomTourData,
                    updated_at: new Date()
                };
                
                await collection.insertOne(tourData);
            }
            
            console.log(`Updated room tour for ProductID ${productId}: ${roomTourData?.length || 0} items`);
        } catch (error) {
            console.error('Error updating room tour images:', error);
            throw error;
        }
    }

    // Xóa tất cả ảnh cũ của sản phẩm (MongoDB)
    static async deleteProductImages(productId) {
        try {
            if (!this.mongoDb) {
                throw new Error('MongoDB connection not available');
            }

            // Xóa từ collection images
            const imagesCollection = this.mongoDb.collection('images');
            await imagesCollection.deleteOne({ ProductID: productId });
            
            // Xóa từ collection room_tour_images
            const roomTourCollection = this.mongoDb.collection('room_tour_images');
            await roomTourCollection.deleteOne({ ProductID: productId });

            console.log(`Deleted all images for ProductID ${productId}`);
        } catch (error) {
            console.error('Error deleting product images:', error);
            throw error;
        }
    }
}

// Initialize MongoDB connection when module is loaded
ProductModel.initMongo();

module.exports = ProductModel;
