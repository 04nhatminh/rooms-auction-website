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
    // Lấy ảnh đầu tiên của một ProductID
    static async getFirstImageByProductId(productId) {
        try {
            console.log(`🔍 Searching for images with ProductID: ${productId}`);
            
            const database = await connectToMongoDB();
            const collection = database.collection('images');
            
            // Tìm document với ProductID (viết hoa)
            const document = await collection.findOne({
                ProductID: parseInt(productId) // Đảm bảo convert sang số
            });
            
            if (!document) {
                console.log(`❌ No document found for ProductID: ${productId}`);
                return null;
            }
            
            console.log(`✅ Found document for ProductID: ${productId}`);
            
            // Kiểm tra array Images
            if (!document.Images || !Array.isArray(document.Images) || document.Images.length === 0) {
                console.log(`❌ No images array found for ProductID: ${productId}`);
                return null;
            }
            
            // Lấy ảnh đầu tiên từ array
            const firstImage = document.Images[0];
            const imageUrl = firstImage.baseUrl;
            
            console.log(`✅ Found first image for ProductID ${productId}: ${imageUrl}`);
            return imageUrl;
            
        } catch (error) {
            console.error(`Error fetching image for ProductID ${productId}:`, error);
            return null;
        }
    }

    // Lấy tất cả ảnh của một ProductID
    static async getAllImagesByProductId(productId) {
        try {
            console.log(`🔍 Fetching all images for ProductID: ${productId}`);
            
            const database = await connectToMongoDB();
            const collection = database.collection('images');
            
            const document = await collection.findOne({
                ProductID: parseInt(productId)
            });
            
            if (!document || !document.Images || !Array.isArray(document.Images)) {
                console.log(`❌ No images found for ProductID: ${productId}`);
                return [];
            }
            
            // Trả về array các URL từ baseUrl
            const imageUrls = document.Images
                .filter(img => img.baseUrl) // Chỉ lấy những ảnh có baseUrl
                .map(img => img.baseUrl);
            
            console.log(`✅ Found ${imageUrls.length} images for ProductID: ${productId}`);
            return imageUrls;
            
        } catch (error) {
            console.error(`Error fetching images for ProductID ${productId}:`, error);
            return [];
        }
    }

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

    // Method debug để xem cấu trúc dữ liệu
    static async getSampleImages(limit = 5) {
        try {
            const database = await connectToMongoDB();
            const collection = database.collection('images');
            
            const samples = await collection.find({}).limit(limit).toArray();
            
            console.log('📸 Sample images from MongoDB:');
            samples.forEach((doc, index) => {
                console.log(`   ${index + 1}. ProductID: ${doc.ProductID}, Images count: ${doc.Images?.length || 0}`);
                if (doc.Images && doc.Images.length > 0) {
                    console.log(`      First image: ${doc.Images[0].baseUrl}`);
                }
            });
            
            return samples;
        } catch (error) {
            console.error('Error getting sample images:', error);
            return [];
        }
    }
}

module.exports = ImageModel;
