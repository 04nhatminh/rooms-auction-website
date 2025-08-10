const ImageModel = require('../models/imageModel');

class ImageController {
    /**
     * API lấy hình ảnh đầu tiên cho một ProductID
     * GET /api/images/:productId
     */
    static async getFirstImage(req, res) {
        try {
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'ProductID is required'
                });
            }

            const imageUrl = await ImageModel.getFirstImageByProductId(productId);

            if (!imageUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'No image found for this ProductID',
                    data: { productId }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Image retrieved successfully',
                data: {
                    productId,
                    imageUrl
                }
            });

        } catch (error) {
            console.error('Error in getFirstImage:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy tất cả hình ảnh cho một ProductID
     * GET /api/images/:productId/all
     */
    static async getAllImages(req, res) {
        try {
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'ProductID is required'
                });
            }

            const imageUrls = await ImageModel.getAllImagesByProductId(productId);

            return res.status(200).json({
                success: true,
                message: 'Images retrieved successfully',
                data: {
                    productId,
                    totalImages: imageUrls.length,
                    imageUrls
                }
            });

        } catch (error) {
            console.error('Error in getAllImages:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * API lấy hình ảnh cho nhiều ProductID cùng lúc
     * POST /api/images/batch
     * Body: { productIds: ["id1", "id2", "id3"] }
     */
    static async getBatchImages(req, res) {
        try {
            const { productIds } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ProductIds array is required and must not be empty'
                });
            }

            // Giới hạn số lượng để tránh overload
            if (productIds.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many ProductIds. Maximum 100 allowed per request.'
                });
            }

            console.log(`Processing batch image request for ${productIds.length} ProductIDs`);
            const imageMap = await ImageModel.getBatchFirstImages(productIds);

            // Vẫn return success ngay cả khi một số images không tìm thấy
            return res.status(200).json({
                success: true,
                message: 'Batch images retrieved successfully',
                data: {
                    totalRequested: productIds.length,
                    totalFound: Object.keys(imageMap).length,
                    imageMap
                }
            });

        } catch (error) {
            console.error('Error in getBatchImages:', error);
            
            // Fallback: return empty imageMap thay vì error
            return res.status(200).json({
                success: false,
                message: 'MongoDB connection failed, returning empty results',
                data: {
                    totalRequested: req.body.productIds ? req.body.productIds.length : 0,
                    totalFound: 0,
                    imageMap: {},
                    error: error.message
                }
            });
        }
    }

    /**
     * API lấy total_reviews cho một productId
     * GET /api/images/reviews/:productId
     */
    static async getTotalReviews(req, res) {
        try {
            const { productId } = req.params;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'ProductId is required'
                });
            }

            const totalReviews = await ImageModel.getTotalReviewsByProductId(productId);

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

    /**
     * API lấy total_reviews cho nhiều productId cùng lúc
     * POST /api/images/reviews/batch
     * Body: { productIds: ["id1", "id2", "id3"] }
     */
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
            const reviewsMap = await ImageModel.getBatchTotalReviews(productIds);

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

module.exports = ImageController;
