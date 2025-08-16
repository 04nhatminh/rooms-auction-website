const { MongoClient } = require('mongodb');
const pool = require('../config/database');

class ReviewModel {
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

    // Lấy total_reviews cho nhiều product_id cùng lúc
    // @param {Array} productIds - Mảng các product_id
    // @returns {Object} - Object với key là product_id và value là total_reviews
    async getBatchTotalReviews(productIds) {
        try {
            console.log(`Fetching batch reviews for ${productIds.length} product_ids`);
            const db = await this.connect();
            
            if (!db) {
                throw new Error('Database connection failed');
            }

            const reviewsCollection = db.collection('reviews');

            const results = await reviewsCollection.find(
                { ProductID: { $in: productIds } },
                { 
                    projection: { 
                        ProductID: 1,
                        total_reviews: 1 
                    }
                }
            ).toArray();

            console.log(`MongoDB batch reviews query found ${results.length} results out of ${productIds.length} requested`);

            const reviewsMap = {};
            results.forEach(result => {
                if (result.ProductID && typeof result.total_reviews === 'number') {
                    reviewsMap[result.ProductID] = result.total_reviews;
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

module.exports = new ReviewModel();
