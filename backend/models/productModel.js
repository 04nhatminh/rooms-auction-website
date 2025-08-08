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
            this.mongoDb = client.db('air2airbnb');
        } catch (err) {
            console.error("MongoDB connection failed:", err);
        }
    }

    async getProductDetails(productID) 
    {
        try {
            const query = 'SELECT * FROM products WHERE ProductID = ?';
            const [products] = await db.execute(query, [productID]);
            console.log(`Fetched product details for ProductID ${productID}:`, products);
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
            return amenities;
        } catch (error) {
            console.error('Error fetching product amenities:', error);
            throw error;
        }
    }

    async getProductDescription(productID) {
        const [products] = await db.execute('SELECT ExternalID, Name FROM Products WHERE ProductID = ?', [productID]);

        if (products.length === 0) {
            console.log(`No product found in MySQL for ProductID ${productID}`);
            return;
        }

        const externalID = products[0].ExternalID;

        // Step 2: Fetch matching document from MongoDB
        const collection = this.mongoDb.collection('descriptions');
        const matchingDoc = await collection.findOne({ ExternalID: externalID });

        if (!matchingDoc) {
        return { success: false, message: 'No description found in MongoDB' };
        }

        // Step 3: Return the MongoDB document

        console.log(`Found description in MongoDB for ExternalID ${externalID}`);
        console.log(`Description: ${matchingDoc.Descriptions}`);
        return {
            success: true,
            externalID: externalID,
            descriptions: matchingDoc.Descriptions
        };

    }

}

module.exports = new ProductModel();
