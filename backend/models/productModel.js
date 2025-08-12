const db = require('../config/database');
const { MongoClient } = require('mongodb');

class ProductModel {

    constructor() {
        // Initialize MongoDB connection once
        this.mongoReady = this.initMongo();
    }

    async initMongo() {
        try {
            const client = await MongoClient.connect('mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/');
            this.mongoDb = client.db('a2airbnb');
        } catch (err) {
            console.error("MongoDB connection failed:", err);
        }
    }

    async getProductDetails(productExternalID) 
    {
        try {
            const query = 'SELECT * FROM products WHERE ExternalID = ?';
            const [products] = await db.execute(query, [productExternalID]);
            console.log(`Fetched product details for ProductID ${productExternalID}:`, products);
            return products[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product details:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    async getProductAmenities(productID) {
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
            const [amenities] = await db.execute(query, [productID]);
            console.log(`Fetched amenities for ProductID ${productID}:`, amenities);
            return amenities;
        } catch (error) {
            console.error('Error fetching product amenities:', error);
            throw error;
        }
    }

    async getProductDescription(productID) {

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

    async getProductReviews(productID) {

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

    async getProductImages(productID) {

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

    async getProductPolicies(productID) {

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

    async getProductProvinceName(productID) 
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
                const [provinceName] = await db.execute(query, [productID]);
                console.log(`Fetched product province for ProductID ${productID}:`, provinceName);
                return provinceName[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product province:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    async getProductDistrictName(productID) 
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
                const [districtName] = await db.execute(query, [productID]);
                console.log(`Fetched product district for ProductID ${productID}:`, districtName);
                return districtName[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product district:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    async getProductPropertyTypeName(productID) 
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
                const [property] = await db.execute(query, [productID]);
                console.log(`Fetched product property name for ProductID ${productID}:`, property);
                return property[0]; // Trả về sản phẩm đầu tiên
        } catch (error) {
            console.error('Error fetching product property name:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }
}

module.exports = new ProductModel();
