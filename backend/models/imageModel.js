const { MongoClient } = require('mongodb');

// MongoDB connection
let db = null;

async function connectToMongoDB() {
    if (!db) {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/a2airbnb';
            const client = new MongoClient(mongoUri);
            await client.connect();
            db = client.db('a2airbnb'); // Đảm bảo tên database đúng
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }
    return db;
}

class ImageModel {
    // Lấy ảnh đầu tiên cho nhiều ProductID
    static async getBatchFirstImages(productIds) {
        try {
            console.log(`🔍 Fetching batch images for ${productIds.length} ProductIDs`);
            
            const database = await connectToMongoDB();
            const collection = database.collection('images');
            
            // Convert tất cả productIds sang số
            const numericProductIds = productIds.map(id => parseInt(id));
            
            // Tìm tất cả documents với ProductID trong array
            const documents = await collection.find({
                ProductID: { $in: numericProductIds }
            }).toArray();
            
            const imageMap = {};
            
            documents.forEach(doc => {
                if (doc.Images && Array.isArray(doc.Images) && doc.Images.length > 0) {
                    const firstImage = doc.Images[0];
                    if (firstImage.baseUrl) {
                        imageMap[doc.ProductID] = firstImage.baseUrl;
                    }
                }
            });
            
            console.log(`✅ Found images for ${Object.keys(imageMap).length}/${productIds.length} ProductIDs`);
            return imageMap;
            
        } catch (error) {
            console.error('Error in getBatchFirstImages:', error);
            return {};
        }
    }
}

module.exports = ImageModel;
