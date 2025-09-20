const ReviewModel = require('../models/reviewModel');
const pool = require('../config/database');

class ReviewController {
    static async getProductIdByUID(uid) {
        // Kết quả CALL trong mysql2/promise thường là: [ [rows], otherMeta ]
        const [spResult] = await pool.query('CALL a2airbnb.SearchProductIDFromUID(?)', [uid]);

        // Một số MySQL driver trả [ [rows], [fields], ... ]; lấy mảng rows đầu
        const rowsLevel1 = Array.isArray(spResult) ? spResult[0] : spResult;
        const firstRow = Array.isArray(rowsLevel1) ? rowsLevel1[0] : rowsLevel1?.[0];

        if (!firstRow) return null;

        // Ưu tiên product_id, fallback productId, hoặc lấy cột đầu tiên
        return firstRow.product_id ?? firstRow.productId ?? Object.values(firstRow)[0] ?? null;
    }

    // Map nhiều UID -> productId (chạy song song)
    // @returns { productIds: string[], uidToProductId: Record<string,string|null> }
    static async mapUIDsToProductIds(uids) {
        const results = await Promise.all(
            uids.map(async (uid) => {
                try {
                    const pid = await ReviewController.getProductIdByUID(uid);
                    return { uid, productId: pid ?? null };
                } catch (e) {
                    // Nếu lỗi tra cứu từng UID, set null để không chặn cả batch
                    return { uid, productId: null, _error: e.message };
                }
            })
        );

        const uidToProductId = {};
        const productIds = [];

        for (const r of results) {
            uidToProductId[r.uid] = r.productId;
            if (r.productId) productIds.push(r.productId);
        }

        return { productIds, uidToProductId };
    }

    // API lấy total_reviews cho nhiều productId cùng lúc
    // POST /api/reviews/batch
    // Body: { productIds: ["id1", "id2", "id3"] }
    static async getBatchTotalReviews(req, res) {
        try {
            const { uids } = req.body;

            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Uids array is required and must not be empty'
                });
            }

            if (uids.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many uids. Maximum 100 allowed per request.'
                });
            }

            // Map UID -> productId
            const { productIds, uidToProductId } = await ReviewController.mapUIDsToProductIds(uids);

            // Không tìm được productId nào
            if (productIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No productIds resolved from provided uids',
                    data: {
                        totalRequested: uids.length,
                        totalResolvedProductIds: 0,
                        totalFound: 0,
                        uidToProductId,
                        reviewsMapByUID: {}
                    }
                });
            }

            const reviewsMap = await ReviewModel.getBatchTotalReviews(productIds);

            const reviewsMapByUID = {};
            for (const uid of uids) {
                const pid = uidToProductId[uid];
                reviewsMapByUID[uid] = pid ? (reviewsMap[pid] ?? null) : null;
            }

            return res.status(200).json({
                success: true,
                message: 'Batch reviews retrieved successfully',
                data: {
                    reviewsMapByUID
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