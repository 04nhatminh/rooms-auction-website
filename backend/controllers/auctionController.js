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

    // Lấy danh sách tất cả auction cho admin
    static async getAllAuctionsForAdmin(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            console.log(`\ngetAllAuctionsForAdmin - page: ${page}, limit: ${limit}, offset: ${offset}`);

            const pool = require('../config/database');
            const countQuery = `SELECT COUNT(*) as total FROM Auction`;

            console.log('Executing count query...');
            const [countResult] = await pool.execute(countQuery);
            const total = countResult[0].total;
            console.log(`Total auctions: ${total}`);

            console.log('Executing main query with params:', [parseInt(limit), offset]);
            const auctions = await AuctionModel.getAllAuctionsForAdmin(parseInt(limit), parseInt(offset));
            console.log(`Retrieved ${auctions.length} auctions`);

            const totalPages = Math.ceil(total / parseInt(limit));

            return res.status(200).json({
                success: true,
                data: {
                    items: auctions,
                    totalPages,
                    currentPage: parseInt(page),
                    totalItems: total
                }
            });

        } catch (error) {
            console.error('Error in getAllAuctionsForAdmin:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Lấy danh sách tất cả auction theo status
    //router.get('/auctions/status/:status', verifyToken, isAdmin, auctionController.getAuctionsByStatus);
    static async getAllAuctionsByStatusForAdmin(req, res) {
        try {
            const { status } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            console.log(`\ngetAllAuctionsByStatusForAdmin - status: ${status}, page: ${page}, limit: ${limit}, offset: ${offset}`);

            const pool = require('../config/database');
            const countQuery = `SELECT COUNT(*) as total FROM Auction WHERE status = ?`;

            console.log('Executing count query...');
            const [countResult] = await pool.execute(countQuery, [status]);
            const total = countResult[0].total;
            console.log(`Total auctions: ${total}`);

            console.log('Executing main query with params:', [parseInt(limit), offset]);
            const auctions = await AuctionModel.getAllAuctionsByStatusForAdmin(status, parseInt(limit), parseInt(offset));
            console.log(`Retrieved ${auctions.length} ${status} auctions`);

            const totalPages = Math.ceil(total / parseInt(limit));

            return res.status(200).json({
                success: true,
                data: {
                    status: status,
                    items: auctions,
                    totalPages,
                    currentPage: parseInt(page),
                    totalItems: total
                }
            });

        } catch (error) {
            console.error('Error in getAllAuctionsByStatusForAdmin:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Cập nhật trạng thái auction
    //router.patch('/auctions/:id/status', verifyToken, isAdmin, auctionController.updateAuctionStatus);

    // Tìm kiếm auction theo UID
    // router.get('/auctions/search/:uid', verifyToken, isAdmin, auctionController.searchAuctionsByUID);
    static async searchAuctionsByUID(req, res) {
        try {
            const { uid } = req.params;
            console.log(`\nsearchAuctionsByUID - uid: ${uid}`);

            const auctions = await AuctionModel.searchAuctionsByUID(uid);
            console.log(`Found ${auctions.length} auctions matching UID ${uid}`);

            return res.status(200).json({
                success: true,
                data: {
                    uid: uid,
                    totalItems: auctions.length,
                    items: auctions
                }
            });

        } catch (error) {
            console.error('Error in searchAuctionsByUID:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = AuctionController;