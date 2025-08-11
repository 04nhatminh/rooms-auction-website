const { MongoClient } = require('mongodb');

class ImageModel {
    constructor() {
        this.client = null;
        this.db = null;
        this.connectionString = 'mongodb+srv://11_a2airbnb:anhmanminhnhu@cluster0.cyihew1.mongodb.net/';
        this.dbName = 'a2airbnb';
        this.isConnecting = false;
    }

    async connect() {
        // Nếu đã có connection, return luôn
        if (this.db) {
            return this.db;
        }

        // Nếu đang connecting, đợi
        if (this.isConnecting) {
            while (this.isConnecting) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.db;
        }

        try {
            this.isConnecting = true;
            console.log('Connecting to MongoDB...');
            
            this.client = new MongoClient(this.connectionString, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
            });
            
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            
            console.log('Connected to MongoDB successfully');
            return this.db;
            
        } catch (error) {
            console.error('MongoDB connection error:', error);
            this.client = null;
            this.db = null;
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }

    // Lấy hình ảnh đầu tiên của một listing dựa trên ProductID
    // @param {string} productId - ProductID của product
    // @returns {string|null} - baseUrl của hình ảnh đầu tiên hoặc null
    async getFirstImageByProductId(productId) {
        try {
            console.log(`Fetching image for ProductID: ${productId}`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }
            
            const imagesCollection = db.collection('images');

            // Tìm document có ProductID tương ứng
            const result = await imagesCollection.findOne(
                { ProductID: productId },
                { 
                    projection: { 
                        'Images.baseUrl': 1
                    }
                }
            );

            console.log(`MongoDB query result for ${productId}:`, result ? 'Found' : 'Not found');

            if (result && result.Images && result.Images.length > 0) {
                console.log(`Returning image URL: ${result.Images[0].baseUrl}`);
                return result.Images[0].baseUrl;
            }

            return null;

        } catch (error) {
            console.error(`Error fetching image for ProductID ${productId}:`, error);
            return null; // Return null thay vì throw để không break toàn bộ process
        }
    }

    // Lấy tất cả hình ảnh của một listing dựa trên ProductID
    // @param {string} productId - ProductID của product
    // @returns {Array} - Mảng các baseUrl hoặc mảng rỗng
    async getAllImagesByProductId(productId) {
        try {
            const db = await this.connect();
            const imagesCollection = db.collection('images');

            const result = await imagesCollection.findOne(
                { ProductID: productId },
                { projection: { 'Images.baseUrl': 1 } }
            );

            if (result && result.Images) {
                return result.Images.map(img => img.baseUrl);
            }

            return [];

        } catch (error) {
            console.error('Error fetching images from MongoDB:', error);
            throw error;
        }
    }

    // Lấy hình ảnh cho nhiều ProductID cùng lúc
    // @param {Array} productIds - Mảng các ProductID
    // @returns {Object} - Object với key là ProductID và value là baseUrl đầu tiên
    async getBatchFirstImages(productIds) {
        try {
            console.log(`Fetching batch images for ${productIds.length} ProductIDs`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }

            const imagesCollection = db.collection('images');

            const results = await imagesCollection.find(
                { ProductID: { $in: productIds } },
                { 
                    projection: { 
                        ProductID: 1,
                        'Images.baseUrl': 1 
                    }
                }
            ).toArray();

            console.log(`MongoDB batch query found ${results.length} results out of ${productIds.length} requested`);

            const imageMap = {};
            results.forEach(result => {
                if (result.Images && result.Images.length > 0) {
                    imageMap[result.ProductID] = result.Images[0].baseUrl;
                }
            });

            console.log(`Successfully mapped ${Object.keys(imageMap).length} images`);
            return imageMap;

        } catch (error) {
            console.error('Error fetching batch images from MongoDB:', error);
            return {}; // Return empty object thay vì throw
        }
    }
}

module.exports = new ImageModel();
