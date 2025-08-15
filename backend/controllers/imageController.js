const ImageModel = require('../models/imageModel');
const pool = require('../config/database');

class ImageController {
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
                    const pid = await ImageController.getProductIdByUID(uid);
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

    // API lấy hình ảnh đầu tiên cho một ProductID
    // GET /api/images/:productId
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

    // API lấy tất cả hình ảnh cho một ProductID
    // GET /api/images/:productId/all
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

    // API lấy hình ảnh cho nhiều UIDs cùng lúc
    // POST /api/images/batch
    // Body: { uids: ["uid1", "uid2", "uid3"] }
    static async getBatchImages(req, res) {
        try {
            const { uids } = req.body;

            if (!uids || !Array.isArray(uids) || uids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'UIDs array is required and must not be empty'
                });
            }

            // Giới hạn số lượng để tránh overload
            if (uids.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Too many UIDs. Maximum 100 allowed per request.'
                });
            }

            // Map UID -> productId
            const { productIds, uidToProductId } = await ImageController.mapUIDsToProductIds(uids);

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
                        imagesMapByUID: {}
                    }
                });
            }

            console.log(`Processing batch image request for ${productIds.length} ProductIDs`);
            const imageMap = await ImageModel.getBatchFirstImages(productIds);

            const imagesMapByUID = {};
            for (const uid of uids) {
                const pid = uidToProductId[uid];
                imagesMapByUID[uid] = pid ? (imageMap[pid] ?? null) : null;
            }

            return res.status(200).json({
                success: true,
                message: 'Batch images retrieved successfully',
                data: {
                    imagesMapByUID
                }
            });

        } catch (error) {
            console.error('Error in getBatchImages:', error);

            // Fallback: return empty imagesMap thay vì error
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

    // GET /api/images/product/:productId/main - Lấy ảnh chính của sản phẩm
    static async getMainProductImage(req, res) {
        try {
            const { productId } = req.params;
            
            // Sử dụng ImageModel để lấy ảnh đầu tiên
            const imageUrl = await ImageModel.getFirstImageByProductId(productId);

            if (!imageUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ảnh cho sản phẩm này'
                });
            }

            res.json({
                success: true,
                url: imageUrl,
                alt: `Ảnh sản phẩm ${productId}`,
                productId: productId
            });
        } catch (error) {
            console.error('Error getting main product image:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy ảnh sản phẩm',
                error: error.message
            });
        }
    }
}

module.exports = ImageController;
