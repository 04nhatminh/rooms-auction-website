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

    // POST /api/auction/preview
    static async previewCreateForGuest(req, res) {
        try {
            const { productUid, checkin, checkout } = req.body || {};
            if (!productUid || !checkin || !checkout)
            return res.status(400).json({ success:false, message:'Thiếu tham số' });

            const out = await AuctionModel.previewCreate({ productUid, checkin, checkout });
            return res.json({ success:true, data: out });
        } catch (e) {
            console.error('Error previewCreateForGuest:', e);
            return res.status(500).json({ success:false, message:'Internal server error' });
        }
    }

    // POST /api/auction/create
    static async createFromGuest(req, res) {
        try {
            const { productUid, userId, checkin, checkout } = req.body || {};
            if (!productUid || !userId || !checkin || !checkout)
            return res.status(400).json({ success:false, message:'Thiếu tham số' });

            const out = await AuctionModel.createAuction({ productUid, userId, checkin, checkout });
            return res.json({ success:true, data: out });
        } catch (e) {
            const m = e?.message || '';
            if (m.includes('Not enough lead time'))
            return res.status(409).json({ success:false, message:'Chưa đủ thời gian mở phiên' });
            if (m.includes('Active auction'))
            return res.status(409).json({ success:false, message:'Đã có phiên trùng khoảng lưu trú' });
            return res.status(500).json({ success:false, message:'Không thể tạo phiên' });
        }
    }

    // GET /api/auction/by-uid/:auctionUid
    static async getByUID(req, res) {
        try {
            const { auctionUid } = req.params || {};
            if (!auctionUid) return res.status(400).json({ success:false, message:'Thiếu auctionUid' });

            const out = await AuctionModel.getByUID(auctionUid);
            if (!out) return res.status(404).json({ success:false, message:'Auction not found' });

            return res.json({ success:true, data: out });
        } catch (e) {
            console.error('Error getByUID:', e);
            return res.status(500).json({ success:false, message:'Internal server error' });
        }
    }

    // POST /api/auction/:auctionUid/bid
    static async bid(req, res) {
        try {
            const { auctionUid } = req.params || {};
            const { userId, amount } = req.body || {};
            if (!auctionUid || !userId || !amount)
            return res.status(400).json({ success:false, message:'Thiếu tham số' });

            const out = await AuctionModel.placeBid({ auctionUid, userId, amount: Number(amount) });
            return res.json({ success:true, data: out });
        } catch (e) {
            const m = e?.message || '';
            if (m.includes('not found')) return res.status(404).json({ success:false, message:'Phiên không tồn tại' });
            if (m.includes('ended'))     return res.status(409).json({ success:false, message:'Phiên đã kết thúc' });
            if (m.includes('Bid too low')) return res.status(409).json({ success:false, message:m });
            return res.status(500).json({ success:false, message:'Đặt giá thất bại' });
        }
    }
}

module.exports = AuctionController;