const ProductModel = require('../models/productModel');
const { get } = require('../routes');

class ProductController {
    async getFullProductDataByExternalId(req, res) {
        const productExternalID = req.params.UID;
        console.log('GET /api/room/' + productExternalID);

        try {
            // Fetch all in parallel
            const productDetails = await ProductModel.getProductDetails(productExternalID);
            const productID = productDetails.ProductID;
            const [
                productProvinceName,
                productDistrictName,
                productPropertyName,
                productAmenities,
                productDescription,
                productReviews,
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
                    details: productDetails,
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


module.exports = new ProductController();
