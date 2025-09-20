const { MongoClient } = require('mongodb');

// MongoDB connection
let db = null;

async function connectToMongoDB() {
    if (!db) {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/';
            const client = new MongoClient(mongoUri);
            await client.connect();
            db = client.db('a2airbnb');
        } catch (error) {
            console.error('MongoDB connection failed when fetching images:', error);
            throw error;
        }
    }
    return db;
}

class ImageModel {
    // Upsert ảnh vào collections images
    static async upsertProductImages(ProductID, Source = 'bidstay', Images) {
        const database = await connectToMongoDB();
        const col = database.collection('images');
        await col.updateOne(
            { ProductID, Source },
            { $set: { Images, updated_at: new Date() }, $setOnInsert: { ProductID, Source } },
            { upsert: true }
        );
    }

    // Upsert room tour images
    static async upsertRoomTour(ProductID, Source = 'user', RoomTourItems) {
        const database = await connectToMongoDB();
        const col = database.collection('room_tour_images');
        await col.updateOne(
            { ProductID, Source },
            { $set: { RoomTourItems, updated_at: new Date() }, $setOnInsert: { ProductID, Source } },
            { upsert: true }
        );
    }

    // Lấy ảnh đầu tiên cho nhiều ProductID
    static async getBatchFirstImages(productIds) {
        try {
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
            
            return imageMap;
            
        } catch (error) {
            console.error('Error in getBatchFirstImages:', error);
            return {};
        }
    }
}

module.exports = ImageModel;
