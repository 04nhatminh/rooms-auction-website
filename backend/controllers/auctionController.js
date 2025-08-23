const AuctionModel = require('../models/auctionModel');

class AuctionController {
    // GET /api/auction/:auctionId
    static async getAuctionById(req, res) {
        const auctionId = req.params.auctionId;
        console.log('GET /api/auction/' + auctionId);

        try {
            const auction = await AuctionModel.getAuctionDetails(auctionId);
            if (!auction) {
                return res.status(404).json({
                    success: false,
                    message: 'Auction not found'
                });
            }
            return res.status(200).json({
                success: true,
                message: `Auction details for ${auctionId}`,
                data: auction
            });
        } catch (error) {
            console.error('Error in getAuctionById:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET /api/auction/province/:provinceCode?status=<status>&limit=<limit>
    static async getAuctionsByProvinceByStatus(req, res) {
        const provinceCode = req.params.provinceCode;
        const status = req.query.status || 'active';
        const limit = req.query.limit || 15;
        
        console.log('GET /api/auction/province=' + provinceCode);
        console.log('Parameters received:', {
            provinceCode: provinceCode,
            provinceCodeType: typeof provinceCode,
            status: status,
            statusType: typeof status,
            limit: limit,
            limitType: typeof limit
        });

        try {
            let auctions;
            auctions = await AuctionModel.getAuctionsByProvinceByStatus(
                provinceCode, 
                status,
                parseInt(limit)
            );

            console.log('Auctions returned from model:', auctions);

            // Remove ProductID, ExternalID from each auction
            // auctions = auctions.map(({ ProductID: _, ExternalID: __, ...auction }) => auction);

            return res.status(200).json({
                success: true,
                message: `Auctions in province ${provinceCode} with status ${status}`,
                data: {
                    provinceCode,
                    status,
                    totalAuctions: auctions.length,
                    auctions
                }
            });

        } catch (error) {
            console.error('Error in getAuctionsByProvinceByStatus:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET /api/auction/district/:districtCode?status=<status>&limit=<limit>
    static async getAuctionsByDistrictByStatus(req, res) {
        const districtCode = req.params.districtCode;
        const status = req.query.status || 'active';
        const limit = req.query.limit || 15;
        console.log('GET /api/auction/district=' + districtCode);

        try {
            let auctions;
            auctions = await AuctionModel.getAuctionsByDistrictByStatus(
                districtCode,
                status,
                parseInt(limit)
            );

            // Remove ProductID, ExternalID from each auction
            // auctions = auctions.map(({ ProductID: _, ExternalID: __, ...auction }) => auction);

            return res.status(200).json({
                success: true,
                message: `Auctions in district ${districtCode} with status ${status}`,
                data: {
                    districtCode,
                    status,
                    totalAuctions: auctions.length,
                    auctions
                }
            });

        } catch (error) {
            console.error('Error in getAuctionsByDistrictByStatus:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET /api/auction/ending-soon
    static async getEndingSoonAuctions(req, res) {
        console.log('GET /api/auction/ending-soon');
        const limit = req.query.limit || 15;

        try {
            const auctions = await AuctionModel.getEndingSoonAuctions(limit);

            return res.status(200).json({
                success: true,
                message: 'Auctions ending soon',
                data: {
                    totalAuctions: auctions.length,
                    auctions
                }
            });

        } catch (error) {
            console.error('Error in getEndingSoonAuctions:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET /api/auction/featured
    static async getFeaturedAuctions(req, res) {
        console.log('GET /api/auction/featured');
        const limit = req.query.limit || 15;

        try {
            const auctions = await AuctionModel.getFeaturedAuctions(limit);

            return res.status(200).json({
                success: true,
                message: 'Featured auctions',
                data: {
                    totalAuctions: auctions.length,
                    auctions
                }
            });

        } catch (error) {
            console.error('Error in getFeaturedAuctions:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // GET /api/auction/newest
    static async getNewestAuctions(req, res) {
        console.log('GET /api/auction/newest');
        const limit = req.query.limit || 15;

        try {
            const auctions = await AuctionModel.getNewestAuctions(limit);

            return res.status(200).json({
                success: true,
                message: 'Newest auctions',
                data: {
                    totalAuctions: auctions.length,
                    auctions
                }
            });

        } catch (error) {
            console.error('Error in getNewestAuctions:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = AuctionController;