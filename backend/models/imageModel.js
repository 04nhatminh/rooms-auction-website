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

    /**
     * Lấy hình ảnh đầu tiên của một listing dựa trên ExternalID
     * @param {string} externalId - ExternalID của product
     * @returns {string|null} - baseUrl của hình ảnh đầu tiên hoặc null
     */
    async getFirstImageByExternalId(externalId) {
        try {
            console.log(`Fetching image for ExternalID: ${externalId}`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }
            
            const imagesCollection = db.collection('images');

            // Tìm document có ExternalID tương ứng
            const result = await imagesCollection.findOne(
                { ExternalID: externalId },
                { 
                    projection: { 
                        'Images.baseUrl': 1
                    }
                }
            );

            console.log(`MongoDB query result for ${externalId}:`, result ? 'Found' : 'Not found');

            if (result && result.Images && result.Images.length > 0) {
                console.log(`Returning image URL: ${result.Images[0].baseUrl}`);
                return result.Images[0].baseUrl;
            }

            return null;

        } catch (error) {
            console.error(`Error fetching image for ExternalID ${externalId}:`, error);
            return null; // Return null thay vì throw để không break toàn bộ process
        }
    }

    /**
     * Lấy tất cả hình ảnh của một listing dựa trên ExternalID
     * @param {string} externalId - ExternalID của product
     * @returns {Array} - Mảng các baseUrl hoặc mảng rỗng
     */
    async getAllImagesByExternalId(externalId) {
        try {
            const db = await this.connect();
            const imagesCollection = db.collection('images');

            const result = await imagesCollection.findOne(
                { ExternalID: externalId },
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

    /**
     * Lấy hình ảnh cho nhiều ExternalID cùng lúc
     * @param {Array} externalIds - Mảng các ExternalID
     * @returns {Object} - Object với key là ExternalID và value là baseUrl đầu tiên
     */
    async getBatchFirstImages(externalIds) {
        try {
            console.log(`Fetching batch images for ${externalIds.length} ExternalIDs`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }

            const imagesCollection = db.collection('images');

            const results = await imagesCollection.find(
                { ExternalID: { $in: externalIds } },
                { 
                    projection: { 
                        ExternalID: 1,
                        'Images.baseUrl': 1 
                    }
                }
            ).toArray();

            console.log(`MongoDB batch query found ${results.length} results out of ${externalIds.length} requested`);

            const imageMap = {};
            results.forEach(result => {
                if (result.Images && result.Images.length > 0) {
                    imageMap[result.ExternalID] = result.Images[0].baseUrl;
                }
            });

            console.log(`Successfully mapped ${Object.keys(imageMap).length} images`);
            return imageMap;

        } catch (error) {
            console.error('Error fetching batch images from MongoDB:', error);
            return {}; // Return empty object thay vì throw
        }
    }

    /**
     * Lấy total_reviews cho một listing_id
     * @param {string} listingId - listing_id (tương ứng với ExternalID)
     * @returns {number|null} - total_reviews hoặc null
     */
    async getTotalReviewsByListingId(listingId) {
        try {
            console.log(`Fetching total reviews for listing_id: ${listingId}`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }
            
            const reviewsCollection = db.collection('reviews');

            const result = await reviewsCollection.findOne(
                { listing_id: listingId },
                { 
                    projection: { 
                        total_reviews: 1
                    }
                }
            );

            console.log(`MongoDB reviews query result for ${listingId}:`, result ? `Found ${result.total_reviews} reviews` : 'Not found');

            if (result && typeof result.total_reviews === 'number') {
                return result.total_reviews;
            }

            return null;

        } catch (error) {
            console.error(`Error fetching reviews for listing_id ${listingId}:`, error);
            return null;
        }
    }

    /**
     * Lấy total_reviews cho nhiều listing_id cùng lúc
     * @param {Array} listingIds - Mảng các listing_id
     * @returns {Object} - Object với key là listing_id và value là total_reviews
     */
    async getBatchTotalReviews(listingIds) {
        try {
            console.log(`Fetching batch reviews for ${listingIds.length} listing_ids`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }

            const reviewsCollection = db.collection('reviews');

            const results = await reviewsCollection.find(
                { listing_id: { $in: listingIds } },
                { 
                    projection: { 
                        listing_id: 1,
                        total_reviews: 1 
                    }
                }
            ).toArray();

            console.log(`MongoDB batch reviews query found ${results.length} results out of ${listingIds.length} requested`);

            const reviewsMap = {};
            results.forEach(result => {
                if (result.listing_id && typeof result.total_reviews === 'number') {
                    reviewsMap[result.listing_id] = result.total_reviews;
                }
            });

            console.log(`Successfully mapped ${Object.keys(reviewsMap).length} review counts`);
            return reviewsMap;

        } catch (error) {
            console.error('Error fetching batch reviews from MongoDB:', error);
            return {};
        }
    }
}

module.exports = new ImageModel();
