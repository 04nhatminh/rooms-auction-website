const ProductModel = require('../models/productModel');

class ProductController {
    async getFullProductDataById(req, res) {
        const productID = req.params.id;
        console.log('GET /api/products/' + productID);

        try {
            // Fetch all in parallel
            const [
                productDetails,
                productAmenities,
                productDescription
            ] = await Promise.all([
                ProductModel.getProductDetails(productID),
                ProductModel.getProductAmenities(productID),
                ProductModel.getProductDescription(productID)
            ]);

            if (!productDetails) {
                return res.status(404).json({
                    success: false,
                    message: `No product found with ID ${productID}`
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    details: productDetails,
                    amenities: productAmenities,
                    description: productDescription?.descriptions || []
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

module.exports = new ProductController();
