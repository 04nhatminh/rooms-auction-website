const ReviewModel = require('../models/reviewModel');

class ReviewController {
    // API lấy total_reviews cho một productId
    // GET /api/reviews/:productId
    static async getTotalReviews(req, res) {
        try {
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'ProductId is required'
                });
            }

            const totalReviews = await ReviewModel.getTotalReviewsByProductId(productId);

            if (totalReviews === null) {
                return res.status(404).json({
                    success: false,
                    message: 'No reviews found for this productId',
                    data: { productId }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Total reviews retrieved successfully',
                data: {
                    productId,
                    totalReviews
                }
            });

        } catch (error) {
            console.error('Error in getTotalReviews:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // API lấy total_reviews cho nhiều productId cùng lúc
    // POST /api/reviews/batch
    // Body: { productIds: ["id1", "id2", "id3"] }
    static async getBatchTotalReviews(req, res) {
        try {
            const { productIds } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ProductIds array is required and must not be empty'
                });
            }

            if (productIds.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many productIds. Maximum 100 allowed per request.'
                });
            }

            console.log(`Processing batch reviews request for ${productIds.length} productIds`);
            const reviewsMap = await ReviewModel.getBatchTotalReviews(productIds);

            return res.status(200).json({
                success: true,
                message: 'Batch reviews retrieved successfully',
                data: {
                    totalRequested: productIds.length,
                    totalFound: Object.keys(reviewsMap).length,
                    reviewsMap
                }
            });

        } catch (error) {
            console.error('Error in getBatchTotalReviews:', error);
            
            return res.status(200).json({
                success: false,
                message: 'MongoDB connection failed, returning empty results',
                data: {
                    totalRequested: req.body.productIds ? req.body.productIds.length : 0,
                    totalFound: 0,
                    reviewsMap: {},
                    error: error.message
                }
            });
        }
    }
}

module.exports = ReviewController;
