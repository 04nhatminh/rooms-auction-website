const AuctionModel = require('../models/auctionModel');

class AuctionController {
    // PUT /api/auction/:auctionUid/end
    static async setAuctionEnded(req, res) {
        const auctionUid = req.params.auctionUid;
        try {
            const ok = await AuctionModel.setAuctionEnded(auctionUid);
            if (!ok) {
                return res.status(404).json({ success: false, message: 'Auction not found or already ended' });
            }
            return res.status(200).json({ success: true, message: 'Auction ended successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
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

            const out = await AuctionModel.createAuctionAndInitialBid({ productUid, userId, checkin, checkout });
            return res.json({ success:true, data: out });
        } catch (e) {
        const m = e?.message || '';
            if (m.includes('Stay start too soon')) // từ SP nếu vi phạm lead time
                return res.status(409).json({ success:false, message:'Chưa đủ thời gian mở phiên' });
            if (m.includes('Date range not free') || m.includes('Active auction'))
                return res.status(409).json({ success:false, message:'Đã có phiên trùng khoảng lưu trú' });
            console.log(m);
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
    // Body cần: { auctionUID, userId, amount, checkin, checkout }
    static async bid(req, res) {
        try {
            const { auctionUid } = req.params || {};
            const { userId, amount, checkin, checkout } = req.body || {};

            if (!auctionUid || !userId || !amount || !checkin || !checkout)
                return res.status(400).json({ success:false, message:'Thiếu tham số' });

            const out = await AuctionModel.placeBid({
                auctionUid,
                userId,
                amount: Number(amount),
                checkin,
                checkout
            });
            return res.json({ success:true, data: out });
        } catch (e) {
            const m = e?.message || '';
            if (m.includes('not found'))           return res.status(404).json({ success:false, message:'Phiên không tồn tại' });
            if (m.includes('Auction not active') || m.includes('Auction ended'))
                return res.status(409).json({ success:false, message:'Phiên đã kết thúc' });
            if (m.includes('Bid too low'))         return res.status(409).json({ success:false, message:m });
            if (m.includes('Range expansion conflicts'))
                return res.status(409).json({ success:false, message:'Khoảng ngày bạn chọn xung đột lịch' });
            if (m.includes('Stay start too soon'))
                return res.status(409).json({ success:false, message:'Thời gian lưu trú quá sớm so với quy định đấu giá' });
            return res.status(500).json({ success:false, message:'Đặt giá thất bại' });
        }
    }

    // POST /api/auction/:auctionUid/buy-now
    static async buyNow(req, res) {
        const auctionUid = req.params.auctionUid;
        const { userId, checkin, checkout } = req.body || {};

        // Validate nhanh
        if (!auctionUid) return res.status(400).json({ success:false, message:'Thiếu auctionUid' });
        if (!userId)     return res.status(401).json({ success:false, message:'Bạn cần đăng nhập' });
        if (!checkin || !checkout) {
            return res.status(400).json({ success:false, message:'Thiếu checkin/checkout' });
        }
        if (new Date(checkout) <= new Date(checkin)) {
            return res.status(400).json({ success:false, message:'Ngày trả phòng phải sau ngày nhận phòng' });
        }

        try {
            const { bookingId } = await AuctionModel.buyNow({ auctionUid, userId, checkin, checkout });
            return res.status(200).json({ success:true, message:'Thuê ngay thành công', bookingId });
        } catch (e) {

            console.log(e);
            // Chuẩn hóa thông điệp lỗi từ SP cho UX
            const m = (e && e.message) ? String(e.message) : '';

            if (m.includes('not found')) {
                // Ví dụ: "Auction not found"
                return res.status(404).json({ success:false, message:'Phiên không tồn tại' });
            }
            if (m.includes('Auction ended') || m.includes('Auction not active')) {
                return res.status(409).json({ success:false, message:'Phiên đã kết thúc' });
            }
            if (m.includes('Range expansion conflicts') || m.includes('conflict') || m.includes('trùng lịch')) {
                // SP của bạn có thể throw SIGNAL ... 'Range expansion conflicts'
                return res.status(409).json({ success:false, message:'Khoảng thời gian bạn chọn hiện không khả dụng. Vui lòng chọn ngày khác.' });
            }
            if (m.includes('Stay start too soon')) {
                return res.status(409).json({ success:false, message:'Thời gian lưu trú quá sớm so với quy định đấu giá.' });
            }
            if (m.includes('booking not created') || m.includes('BuyNow failed')) {
                return res.status(500).json({ success:false, message:'Không thể tạo booking. Vui lòng thử lại.' });
            }

            // Mặc định
            return res.status(500).json({ success:false, message:'Thuê ngay thất bại' });
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

            const pool = require('../config/database');
            const countQuery = `SELECT COUNT(*) as total FROM Auction WHERE status = ?`;

            const [countResult] = await pool.execute(countQuery, [status]);
            const total = countResult[0].total;

            const auctions = await AuctionModel.getAllAuctionsByStatusForAdmin(status, parseInt(limit), parseInt(offset));

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

    // Lấy chi tiết auction cho admin
    static async getAuctionDetailsForAdmin(req, res) {
        try {
            const { auctionUID } = req.params;
            console.log(`\ngetAuctionDetailsForAdmin - auctionUID: ${auctionUID}`);

            const auction = await AuctionModel.getAuctionDetailsForAdmin(auctionUID);
            
            if (!auction) {
                return res.status(404).json({
                    success: false,
                    message: 'Auction not found'
                });
            }

            console.log('Retrieved auction details:', auction);

            return res.status(200).json({
                success: true,
                data: auction
            });

        } catch (error) {
            console.error('Error in getAuctionDetailsForAdmin:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Cập nhật status auction
    static async updateAuctionStatus(req, res) {
        try {
            const { auctionUID } = req.params;
            const { status, endReason } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            // Validate status
            const validStatuses = ['active', 'ended', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Valid statuses are: active, ended, cancelled'
                });
            }

            const result = await AuctionModel.updateAuctionStatus(auctionUID, status, endReason);

            return res.status(200).json({
                success: true,
                message: result.message,
                data: { auctionUID, status, endReason }
            });

        } catch (error) {
            console.error('Error in updateAuctionStatus:', error);
            return res.status(500).json({
                success: false,
                message: error.message.includes('Cannot change status') ? error.message : 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = AuctionController;