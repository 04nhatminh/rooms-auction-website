const ImageModel = require('../models/imageModel');

class ImageController {
    /**
     * API lấy hình ảnh đầu tiên cho một ExternalID
     * GET /api/images/:externalId
     */
    static async getFirstImage(req, res) {
        try {
            const { externalId } = req.params;

            if (!externalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ExternalID is required'
                });
            }

            const imageUrl = await ImageModel.getFirstImageByExternalId(externalId);

            if (!imageUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'No image found for this ExternalID',
                    data: { externalId }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Image retrieved successfully',
                data: {
                    externalId,
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
     * API lấy tất cả hình ảnh cho một ExternalID
     * GET /api/images/:externalId/all
     */
    static async getAllImages(req, res) {
        try {
            const { externalId } = req.params;

            if (!externalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ExternalID is required'
                });
            }

            const imageUrls = await ImageModel.getAllImagesByExternalId(externalId);

            return res.status(200).json({
                success: true,
                message: 'Images retrieved successfully',
                data: {
                    externalId,
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
     * API lấy hình ảnh cho nhiều ExternalID cùng lúc
     * POST /api/images/batch
     * Body: { externalIds: ["id1", "id2", "id3"] }
     */
    static async getBatchImages(req, res) {
        try {
            const { externalIds } = req.body;

            if (!externalIds || !Array.isArray(externalIds) || externalIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ExternalIds array is required and must not be empty'
                });
            }

            // Giới hạn số lượng để tránh overload
            if (externalIds.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many ExternalIds. Maximum 100 allowed per request.'
                });
            }

            console.log(`Processing batch image request for ${externalIds.length} ExternalIDs`);
            const imageMap = await ImageModel.getBatchFirstImages(externalIds);

            // Vẫn return success ngay cả khi một số images không tìm thấy
            return res.status(200).json({
                success: true,
                message: 'Batch images retrieved successfully',
                data: {
                    totalRequested: externalIds.length,
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
                    totalRequested: req.body.externalIds ? req.body.externalIds.length : 0,
                    totalFound: 0,
                    imageMap: {},
                    error: error.message
                }
            });
        }
    }

    /**
     * API lấy total_reviews cho một listing_id
     * GET /api/images/reviews/:listingId
     */
    static async getTotalReviews(req, res) {
        try {
            const { listingId } = req.params;

            if (!listingId) {
                return res.status(400).json({
                    success: false,
                    message: 'ListingId is required'
                });
            }

            const totalReviews = await ImageModel.getTotalReviewsByListingId(listingId);

            if (totalReviews === null) {
                return res.status(404).json({
                    success: false,
                    message: 'No reviews found for this listing_id',
                    data: { listingId }
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Total reviews retrieved successfully',
                data: {
                    listingId,
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
     * API lấy total_reviews cho nhiều listing_id cùng lúc
     * POST /api/images/reviews/batch
     * Body: { listingIds: ["id1", "id2", "id3"] }
     */
    static async getBatchTotalReviews(req, res) {
        try {
            const { listingIds } = req.body;

            if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ListingIds array is required and must not be empty'
                });
            }

            if (listingIds.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many listingIds. Maximum 100 allowed per request.'
                });
            }

            console.log(`Processing batch reviews request for ${listingIds.length} listing_ids`);
            const reviewsMap = await ImageModel.getBatchTotalReviews(listingIds);

            return res.status(200).json({
                success: true,
                message: 'Batch reviews retrieved successfully',
                data: {
                    totalRequested: listingIds.length,
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
                    totalRequested: req.body.listingIds ? req.body.listingIds.length : 0,
                    totalFound: 0,
                    reviewsMap: {},
                    error: error.message
                }
            });
        }
    }
}

module.exports = ImageController;
