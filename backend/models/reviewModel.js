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
            console.error('MongoDB connection failed when fetching reviews:', error);
            throw error;
        }
    }
    return db;
}

class ReviewModel {
    // Lấy total_reviews cho nhiều product_id cùng lúc
    // @param {Array} productIds - Mảng các product_id
    // @returns {Object} - Object với key là product_id và value là total_reviews
    async getBatchTotalReviews(productIds) {
        try {
            const db = await connectToMongoDB();

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

            const reviewsMap = {};
            results.forEach(result => {
                if (result.ProductID && typeof result.total_reviews === 'number') {
                    reviewsMap[result.ProductID] = result.total_reviews;
                }
            });

            return reviewsMap;

        } catch (error) {
            console.error('Error fetching batch reviews from MongoDB:', error);
            return {};
        }
    }
}

module.exports = new ReviewModel();
