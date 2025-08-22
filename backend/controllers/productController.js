const ProductModel = require('../models/productModel');

class ProductController {
    static async getFullProductDataByProductId(req, res) {
        const productUID = req.params.UID;
        console.log('GET /api/room/' + productUID);

        try {
            // Fetch all in parallel
            const productDetails = await ProductModel.getProductDetails(productUID);
            const productID = productDetails.ProductID;
            
            // Remove ProductID, ExternalID, Source, CreatedAt, LastSyncedAt, from details before sending response
            const { ProductID: _, ExternalID: __, Source: ___, CreatedAt: ____, LastSyncedAt: _____, 
                ...detailsWithoutProductID } = productDetails;

            const [
                productProvinceName,
                productDistrictName,
                productPropertyName,
                productAmenitiesRaw,
                productDescription,
                productReviewsRaw,
                productImages,
                productPolicies
            ] = await Promise.all([
                
                ProductModel.getProductProvinceName(productID),
                ProductModel.getProductDistrictName(productID),
                ProductModel.getProductPropertyTypeName(productID),
                ProductModel.getProductAmenities(productID),
                ProductModel.getProductDescription(productID),
                ProductModel.getProductReviews(productID),
                ProductModel.getProductImages(productID),
                ProductModel.getProductPolicies(productID)
            ]);

            // Remove AmenityID from amenities
            const productAmenities = productAmenitiesRaw.map(({ AmenityID, ...amenity }) => amenity);

            // Remove unwanted fields from reviews
            let productReviews = productReviewsRaw;
            if (productReviewsRaw && typeof productReviewsRaw === 'object') {
                const { _id, ProductID: reviewProductID, Source, ...reviewsWithoutUnwantedFields } = productReviewsRaw;
                
                // Remove externalId from each review in the reviews array
                if (reviewsWithoutUnwantedFields.reviews && Array.isArray(reviewsWithoutUnwantedFields.reviews)) {
                    reviewsWithoutUnwantedFields.reviews = reviewsWithoutUnwantedFields.reviews.map(({ externalId, ...review }) => review);
                }
                
                productReviews = reviewsWithoutUnwantedFields;
            }

            const averageRating = calculateRating(productReviews);

            if (!productDetails) {
                return res.status(404).json({
                    success: false,
                    message: `No product found with ID ${productDetails}`
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    details: detailsWithoutProductID,
                    provinceName: productProvinceName,
                    districtName: productDistrictName,
                    propertyName: productPropertyName,
                    amenities: productAmenities,
                    description: productDescription,
                    reviews: productReviews,
                    images: productImages,
                    policies: productPolicies, 
                    averageRating: averageRating
                }
            });

        } catch (error) {
            console.error('Error fetching full product data:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }

    // API lấy top products theo province
    // GET /api/products/top-rated/province?provinceCode=01&limit=15
    static async getTopRatedProductsByProvince(req, res) {
        try {
            const { provinceCode, limit = 15, method = 'main' } = req.query;
            
            let products;
            products = await ProductModel.getTopRatedProductsByProvince(
                provinceCode, 
                parseInt(limit)
            );

            // Remove ProductID, ExternalID from each product
            products = products.map(({ ProductID: _, ExternalID: __, ...product }) => product);

            return res.status(200).json({
                success: true,
                message: `Top ${limit} rated products in province ${provinceCode}`,
                data: {
                    provinceCode,
                    totalProducts: products.length,
                    method: method,
                    products
                }
            });

        } catch (error) {
            console.error('Error in getTopRatedProducts:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // API lấy top products theo district
    // GET /api/products/top-rated/district?districtCode=01&limit=15
    static async getTopRatedProductsByDistrict(req, res) {
        try {
            const { districtCode, limit = 15, method = 'main' } = req.query;

            let products;
            products = await ProductModel.getTopRatedProductsByDistrict(
                districtCode,
                parseInt(limit)
            );

            // Remove ProductID, ExternalID from each product
            products = products.map(({ ProductID: _, ExternalID: __, ...product }) => product);

            return res.status(200).json({
                success: true,
                message: `Top ${limit} rated products in district ${districtCode}`,
                data: {
                    districtCode,
                    totalProducts: products.length,
                    method: method,
                    products
                }
            });

        } catch (error) {
            console.error('Error in getTopRatedProducts:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET /api/properties/types - Lấy danh sách property types
    static async getAllPropertyTypes(req, res) {
        try {
            const types = await ProductModel.getAllPropertyTypes();
            return res.status(200).json({
                success: true,
                data: types
            });
        } catch (error) {
            console.error('Error in getAllPropertyTypes:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Admin Methods
    // GET /api/room/admin/list - Lấy danh sách tất cả sản phẩm cho admin
    static async getAllProductsForAdmin(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            console.log(`\ngetAllProductsForAdmin - page: ${page}, limit: ${limit}, offset: ${offset}`);

            const pool = require('../config/database');
            const countQuery = `SELECT COUNT(*) as total FROM Products WHERE is_deleted = 0`;

            console.log('Executing count query...');
            const [countResult] = await pool.execute(countQuery);
            const total = countResult[0].total;
            console.log(`Total products: ${total}`);

            console.log('Executing main query with params:', [parseInt(limit), offset]);
            const products = await ProductModel.getAllProductsForAdmin(parseInt(limit), parseInt(offset));
            console.log(`Retrieved ${products.length} products`);

            const totalPages = Math.ceil(total / parseInt(limit));

            return res.status(200).json({
                success: true,
                data: {
                    items: products,
                    totalPages,
                    currentPage: parseInt(page),
                    totalItems: total
                }
            });

        } catch (error) {
            console.error('Error in getAllProductsForAdmin:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // POST /api/room/admin/create - Tạo sản phẩm mới
    static async createProduct(req, res) {
        try {
            // Validation cơ bản
            const { name, region, provinceCode, price } = req.body;
            if (!name || !region || !provinceCode || !price) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên sản phẩm, vùng miền, tỉnh và giá là bắt buộc'
                });
            }
            const result = await ProductModel.createProduct(req.body);
            return res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: result
            });
        } catch (error) {
            console.error('Error in createProduct:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // PUT /api/room/admin/:id - Cập nhật sản phẩm
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            await ProductModel.updateProduct(id, req.body);
            return res.status(200).json({
                success: true,
                message: 'Cập nhật sản phẩm thành công',
                data: { id }
            });
        } catch (error) {
            console.error('Error in updateProduct:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // GET /api/room/admin/search - Tìm kiếm sản phẩm theo UID cho admin
    static async searchProductsByUID(req, res) {
        try {
            const { uid, page = 1, limit = 10 } = req.query;
            
            if (!uid || uid.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'UID tìm kiếm không được để trống'
                });
            }
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            console.log(`\nsearchProductsByUID - uid: ${uid}, page: ${page}, limit: ${limit}, offset: ${offset}`);
            
            const result = await ProductModel.searchProductsByUID(uid, parseInt(limit), offset);
            const { products, total } = result;
            
            console.log(`Found ${products.length} products matching UID: ${uid}`);
            
            const totalPages = Math.ceil(total / parseInt(limit));
            
            return res.status(200).json({
                success: true,
                data: {
                    items: products,
                    totalPages,
                    currentPage: parseInt(page),
                    totalItems: total
                }
            });
            
        } catch (error) {
            console.error('Error in searchProductsByUID:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // DELETE /api/room/admin/:id - Xóa sản phẩm
    static async deleteProduct(req, res) {
    const { id } = req.params;
        try {
            const result = await ProductModel.softDeleteProduct(id);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
        }
    }
}

function calculateRating(productReviews) {
    if (
    !productReviews ||
    !Array.isArray(productReviews.reviews) ||
    productReviews.reviews.length === 0
    ) return 0;

    const totalReviews = productReviews.total_reviews;
        
    const sumRatings = productReviews.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (sumRatings / totalReviews).toFixed(2);

    console.log(`Calculated average rating: ${averageRating} based on ${totalReviews} reviews`);

    return averageRating;
}


module.exports = ProductController;
