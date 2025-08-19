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

    // API tìm kiếm products theo multiple criteria
    // GET /api/products/search
    static async searchProducts(req, res) {
        try {
            const {
                provinceCode,
                maxPrice,
                minPrice,
                maxGuests,
                propertyType,
                roomType,
                minRating,
                limit = 20,
                offset = 0
            } = req.query;

            // Xây dựng query động dựa trên parameters
            let whereConditions = [];
            let queryParams = [];

            if (provinceCode) {
                whereConditions.push('p.ProvinceCode = ?');
                queryParams.push(provinceCode);
            }

            if (minPrice) {
                whereConditions.push('p.Price >= ?');
                queryParams.push(parseFloat(minPrice));
            }

            if (maxPrice) {
                whereConditions.push('p.Price <= ?');
                queryParams.push(parseFloat(maxPrice));
            }

            if (maxGuests) {
                whereConditions.push('p.MaxGuests >= ?');
                queryParams.push(parseInt(maxGuests));
            }

            if (propertyType) {
                whereConditions.push('p.PropertyType = ?');
                queryParams.push(parseInt(propertyType));
            }

            if (roomType) {
                whereConditions.push('p.RoomType = ?');
                queryParams.push(parseInt(roomType));
            }

            // Thêm condition cho min rating nếu có
            const ratingCondition = minRating ? `HAVING AverageRating >= ?` : '';
            if (minRating) {
                queryParams.push(parseFloat(minRating));
            }

            // Thêm limit và offset
            queryParams.push(parseInt(limit), parseInt(offset));

            const whereClause = whereConditions.length > 0 
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const query = `
                SELECT 
                    p.UID,
                    p.Name,
                    p.Address,
                    p.ProvinceCode,
                    p.Latitude,
                    p.Longitude,
                    p.MaxGuests,
                    p.NumBedrooms,
                    p.NumBeds,
                    p.NumBathrooms,
                    p.Price,
                    p.Currency,
                    p.CleanlinessPoint,
                    p.LocationPoint,
                    p.ServicePoint,
                    p.ValuePoint,
                    p.CommunicationPoint,
                    p.ConveniencePoint,
                    ROUND(
                        (COALESCE(p.CleanlinessPoint, 0) + 
                         COALESCE(p.LocationPoint, 0) + 
                         COALESCE(p.ServicePoint, 0) + 
                         COALESCE(p.ValuePoint, 0) + 
                         COALESCE(p.CommunicationPoint, 0) + 
                         COALESCE(p.ConveniencePoint, 0)) / 6, 2
                    ) AS AverageRating,
                    prop.PropertyName,
                    prop.PropertyImageURL,
                    rt.RoomTypeName,
                    rt.RoomTypeImageURL,
                    prov.Name AS ProvinceName,
                    prov.NameEn AS ProvinceNameEn
                FROM Products p
                LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                ${whereClause}
                ${ratingCondition}
                ORDER BY AverageRating DESC
                LIMIT ? OFFSET ?
            `;

            const pool = require('../config/database');
            const [rows] = await pool.execute(query, queryParams);

            return res.status(200).json({
                success: true,
                message: 'Products search completed',
                data: {
                    totalResults: rows.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    products: rows
                }
            });

        } catch (error) {
            console.error('Error in searchProducts:', error);
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
            const countQuery = `SELECT COUNT(*) as total FROM Products`;

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
            const {
                name,
                roomNumber,
                bedrooms,
                bathrooms,
                description,
                region,
                province,
                district,
                propertyType,
                amenities,
                images
            } = req.body;

            // Validation cơ bản
            if (!name || !region || !province) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên sản phẩm, vùng miền và tỉnh là bắt buộc'
                });
            }

            const pool = require('../config/database');
            
            // Tạo UID unique
            const uid = `ROOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Insert vào bảng Products
            const insertQuery = `
                INSERT INTO Products (
                    UID, Name, Address, ProvinceCode, DistrictCode,
                    NumBedrooms, NumBathrooms, PropertyType, CreatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await pool.execute(insertQuery, [
                uid,
                name,
                roomNumber || '',
                province,
                district,
                bedrooms || 1,
                bathrooms || 1,
                propertyType || 1
            ]);

            const productId = result.insertId;

            // TODO: Insert description, amenities, images vào các bảng liên quan

            return res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: {
                    id: productId,
                    uid: uid
                }
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
            const updateData = req.body;

            // TODO: Implement update logic
            
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

    // DELETE /api/room/admin/:id - Xóa sản phẩm
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            const pool = require('../config/database');
            const deleteQuery = `DELETE FROM Products WHERE ProductID = ?`;
            
            const [result] = await pool.execute(deleteQuery, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm thành công'
            });

        } catch (error) {
            console.error('Error in deleteProduct:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
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
