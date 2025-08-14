const pool = require('../config/database');
const { MongoClient } = require('mongodb');

class ProductModel {
    constructor() {
        // Initialize MongoDB connection once
        this.mongoReady = this.initMongo();
    }

    static async initMongo() {
        try {
            const client = await MongoClient.connect('mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/');
            this.mongoDb = client.pool('a2airbnb');
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
}

module.exports = ProductModel;
