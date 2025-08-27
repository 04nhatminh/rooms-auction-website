// models/auctionModel.js
const pool = require('../config/database');

function toDateStr(d) {
    const x = (d instanceof Date) ? d : new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function daysBetween(from, to) { return Math.floor((new Date(to) - new Date(from)) / 86400000); }
function roundTo(x, step) { return step ? Math.round(x / step) * step : Math.round(x); }

class AuctionModel {
    // Helper: lấy ProductID từ UID (dùng SP)
    static async _getProductIdByUID(conn, productUid) {
        // SP SearchProductIDFromUID trong DB init
        const [rs] = await conn.query(`CALL SearchProductIDFromUID(?)`, [productUid]);
        // Kết quả dạng [[rows], [meta]]; hàng đầu tiên ở rs[0]
        const row = rs?.[0]?.[0];
        if (row?.ProductID) return row.ProductID;
        return p?.ProductID ?? null;
    }

    // Helper: resolve Auction row theo AuctionUID
    static async _getAuctionByUID(conn, auctionUid, forUpdate = false) {
        const sql = `
            SELECT A.*, P.UID AS ProductUID, P.Name AS ProductName, P.Price AS BasePrice, P.Currency
            FROM Auction A
            JOIN Products P ON P.ProductID = A.ProductID
            WHERE A.AuctionUID = ?`;
        const [[a]] = await conn.query(forUpdate ? sql + ' FOR UPDATE' : sql, [auctionUid]);
        return a || null;
    }

    // Helper: lấy thông tin user từ UserID
    static async _getUserByID(conn, userID) {
        const [[a]] = await conn.query(`SELECT * FROM Users WHERE UserID = ?`, [userID]);
        return a || null;
    }

    // === READS ===
    static async getAuctionDetails(auctionID) {
        try {
            const query = `
                SELECT 
                    a.AuctionUID,
                    a.StayPeriodStart,
                    a.StayPeriodEnd,
                    a.StartTime,
                    a.EndTime,
                    a.StartPrice,
                    a.BidIncrement,
                    b.Amount,
                    a.Status,
                    p.Name AS ProductName,
                    p.UID AS ProductUID,
                    p.ProvinceCode,
                    pr.Name AS ProvinceName,
                    p.DistrictCode,
                    d.Name AS DistrictName,
                    p.PropertyType,
                    p.NumBedrooms,
                    p.NumBeds,
                    p.NumBathrooms,
                    ROUND((
                        COALESCE(p.CleanlinessPoint, 0) + 
                        COALESCE(p.LocationPoint, 0) + 
                        COALESCE(p.ServicePoint, 0) + 
                        COALESCE(p.ValuePoint, 0) + 
                        COALESCE(p.CommunicationPoint, 0) + 
                        COALESCE(p.ConveniencePoint, 0)
                    ) / 6, 2) AS AverageRating
                FROM Auction a
                JOIN Products p   ON a.ProductID = p.ProductID
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                JOIN Districts d  ON p.DistrictCode = d.DistrictCode
                JOIN Bids b ON a.AuctionID = b.AuctionID AND a.MaxBidID = b.BidID
                WHERE a.AuctionID = ?`;
            const [rows] = await pool.query(query, [auctionID]);
            console.log(`Fetched auction details for AuctionID ${auctionID}:`, rows);
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching auction details:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    static async getAuctionsByProvinceByStatus(provinceCode, status, limit = 15) {
        try {
            const query = `
                SELECT 
                    a.AuctionUID,
                    p.UID as ProductUID,
                    a.StayPeriodStart,
                    a.StayPeriodEnd,
                    a.StartTime,
                    a.EndTime,
                    a.StartPrice,
                    b.Amount,
                    pr.Name AS ProvinceName,
                    d.Name  AS DistrictName,
                    a.Status,
                    ROUND((
                        COALESCE(p.CleanlinessPoint, 0) + 
                        COALESCE(p.LocationPoint, 0) + 
                        COALESCE(p.ServicePoint, 0) + 
                        COALESCE(p.ValuePoint, 0) + 
                        COALESCE(p.CommunicationPoint, 0) + 
                        COALESCE(p.ConveniencePoint, 0)
                    ) / 6, 2) AS AverageRating
                FROM Auction a
                JOIN Products p ON a.ProductID = p.ProductID
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                JOIN Districts d ON p.DistrictCode = d.DistrictCode
                JOIN Bids b ON a.AuctionID = b.AuctionID AND a.MaxBidID = b.BidID
                WHERE p.ProvinceCode = ? AND a.Status = ?
                LIMIT ?`;
            const [rows] = await pool.query(query, [provinceCode, status, Number(limit)]);
            console.log(`Fetched auctions for ProvinceCode ${provinceCode} and Status ${status}:`, rows);
            return rows;
        } catch (error) {
            console.error('Error fetching auctions by province:', error);
            throw error;
        }
    }

    static async getAuctionsByDistrictByStatus(districtCode, status, limit = 15) {
        try {
            const query = `
                SELECT 
                    a.AuctionUID,
                    a.ProductID,
                    a.StayPeriodStart,
                    a.StayPeriodEnd,
                    a.StartTime,
                    a.EndTime,
                    a.StartPrice,
                    b.Amount,
                    a.Status,
                    pr.Name AS ProvinceName,
                    d.Name  AS DistrictName,
                    ROUND((
                        COALESCE(p.CleanlinessPoint, 0) + 
                        COALESCE(p.LocationPoint, 0) + 
                        COALESCE(p.ServicePoint, 0) + 
                        COALESCE(p.ValuePoint, 0) + 
                        COALESCE(p.CommunicationPoint, 0) + 
                        COALESCE(p.ConveniencePoint, 0)
                    ) / 6, 2) AS AverageRating
                FROM Auction a
                JOIN Products p   ON a.ProductID = p.ProductID
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                JOIN Districts d  ON p.DistrictCode = d.DistrictCode
                JOIN Bids b ON a.AuctionID = b.AuctionID AND a.MaxBidID = b.BidID
                WHERE p.DistrictCode = ? AND a.Status = ?
                LIMIT ?`;
            const [rows] = await pool.query(query, [districtCode, status, Number(limit)]);
            console.log(`Fetched auctions for DistrictCode ${districtCode} and Status ${status}:`, auctions);
            return rows;
        } catch (error) {
            console.error('Error fetching auctions by district:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    // === PREVIEW === (đọc tham số hệ thống từ DB)
    static async _getParams(conn) {
        const [rows] = await conn.query(`
            SELECT
                CAST(MAX(CASE WHEN ParamName='BidLeadTimeDays'     THEN ParamValue END) AS SIGNED)        AS BidLeadTimeDays,
                CAST(MAX(CASE WHEN ParamName='AuctionDurationDays' THEN ParamValue END) AS SIGNED)        AS AuctionDurationDays,
                CAST(MAX(CASE WHEN ParamName='StartPriceFactor'    THEN ParamValue END) AS DECIMAL(10,4)) AS StartPriceFactor,
                CAST(MAX(CASE WHEN ParamName='BidIncrementFactor'  THEN ParamValue END) AS DECIMAL(10,4)) AS BidIncrementFactor
            FROM SystemParameters`);
        return rows[0];
    }

    static async previewCreate({ productUid, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            const start = toDateStr(checkin);
            const end   = toDateStr(checkout);
            const today = toDateStr(new Date());

            const params = await this._getParams(conn);
            const [[p]] = await conn.query(`SELECT ProductID, Price FROM Products WHERE UID=?`, [productUid]);
            if (!p) throw new Error('Product not found');

            const leadOk = daysBetween(today, start) >= Number(params.BidLeadTimeDays ?? 0);
            const base = Number(p.Price || 0);
            
            const startingPrice = roundTo(base * Number(params.StartPriceFactor ?? 0.7), 1000);
            const bidIncrement  = Math.max(roundTo(base * Number(params.BidIncrementFactor ?? 0.05), 1000), 1000);

            return {
                eligible: leadOk,
                reason: leadOk ? null : `Cần mở trước tối thiểu ${params.BidLeadTimeDays} ngày`,
                durationDays: Number(params.AuctionDurationDays ?? 5),
                startingPrice, bidIncrement,
                productId: p.ProductID
            };
        } finally {
            conn.release();
        }
    }

    // === CREATE AUCTION === (gọi SP CreateAuctionForStay)
    static async createAuction({ productUid, userId, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            const productId = await this._getProductIdByUID(conn, productUid);
            if (!productId) throw new Error('Product not found');

            const userInfo = await this._getUserByID(conn, userId);
            if (!userInfo) throw new Error('User not found');

            const start = toDateStr(checkin);
            const end   = toDateStr(checkout);
            const uid = parseInt(Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));

            // Gọi SP: OUT p_AuctionID vào biến @aid
            await conn.query(`CALL CreateAuctionForStay(?, ?, ?, ?, ?, @aid)`, [uid, productId, start, end, userId]);
            const [[{ aid }]] = await conn.query(`SELECT @aid AS aid`);

            if (!aid) {
                throw new Error('CreateAuctionForStay failed');
            }

            // Lấy lại thông tin phiên (kể cả AuctionUID/CurrentPrice nếu có trong schema)
            const [[a]] = await conn.query(`
                SELECT A.*, P.UID AS ProductUID, P.Name AS ProductName, P.Currency
                FROM Auction A
                JOIN Products P ON P.ProductID = A.ProductID
                WHERE A.AuctionID = ?`, [aid]);

            return {
                auctionId: a?.AuctionID,
                auctionUid: a?.AuctionUID ? String(a.AuctionUID) : null,
                startTime: a?.StartTime,
                endTime: a?.EndTime,
                currentPrice: a?.CurrentPrice ?? a?.StartPrice,
                currency: a?.Currency,
                stayPeriod: { start: a?.StayPeriodStart, end: a?.StayPeriodEnd }
            };
        } catch (e) {
            throw e;
        } finally {
            conn.release();
        }
    }

    static async createAuctionAndInitialBid({ productUid, userId, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            const productId = await this._getProductIdByUID(conn, productUid);
            if (!productId) throw new Error('Product not found');

            const userInfo = await this._getUserByID(conn, userId);
            if (!userInfo) throw new Error('User not found');

            const start = toDateStr(checkin), end = toDateStr(checkout);
            const uid = parseInt(Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'));

            await conn.query(`CALL CreateAuctionAndInitialBid(?, ?, ?, ?, ?, @aid, @bidId)`,
            [uid, productId, start, end, userId]);

            const [[aidRow]] = await conn.query(`SELECT @aid AS aid, @bidId AS bidId`);
            const aid   = aidRow?.aid; 
            const bidId = aidRow?.bidId;
            if (!aid) throw new Error('CreateAuctionAndInitialBid failed');

            const [[a]] = await conn.query(`
                SELECT A.*, P.UID AS ProductUID, P.Name AS ProductName, P.Currency
                FROM Auction A JOIN Products P ON P.ProductID = A.ProductID
                WHERE A.AuctionID=?`, [aid]);

            return {
                auctionId: a.AuctionID,
                auctionUid: a.AuctionUID ? String(a.AuctionUID) : null,
                startTime: a.StartTime, endTime: a.EndTime,
                currentPrice: a.CurrentPrice ?? a.StartPrice,
                currency: a.Currency,
                stayPeriod: { start: a.StayPeriodStart, end: a.StayPeriodEnd },
                firstBidId: bidId ?? null
            };
        } catch (e) {
            throw e;
        } finally {
            conn.release();
        }
    }

    // === GET BY UID ===
    static async getByUID(auctionUid) {
        const [rows] = await pool.query(`
            SELECT A.*, P.UID AS ProductUID, P.Name AS ProductName, P.Price AS BasePrice, P.Currency
            FROM Auction A
            JOIN Products P ON P.ProductID = A.ProductID
            WHERE A.AuctionUID = ?`, [auctionUid]);
        if (!rows.length) return null;

        const a = rows[0];

        const [fullHistory] = await pool.query(`
            SELECT B.BidID, B.Amount, B.BidTime, U.FullName
            FROM Bids B 
            LEFT JOIN Users U ON U.UserID = B.UserID
            WHERE B.AuctionID = ? 
            ORDER BY B.BidTime DESC`, [a.AuctionID]);

        const currentPrice = fullHistory[0].Amount;

        return {
            auction: {
                auctionUid: String(a.AuctionUID || ''),
                productUid: a.ProductUID,
                stayPeriod: { start: a.StayPeriodStart, end: a.StayPeriodEnd },
                startTime: a.StartTime, endTime: a.EndTime,
                startingPrice: a.StartPrice,
                bidIncrement: a.BidIncrement,
                currentPrice: currentPrice ?? a.StartPrice,
                status: a.Status
            },
            room: { name: a.ProductName, basePrice: a.BasePrice, currency: a.Currency },
            fullHistory
        };
    }

    // === PLACE BID === (gọi SP PlaceBid — cần start/end)
    static async placeBid({ auctionUid, userId, amount, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            const a = await this._getAuctionByUID(conn, auctionUid, /*forUpdate*/ false);
            if (!a) throw new Error('Auction not found');

            const start = toDateStr(checkin);
            const end   = toDateStr(checkout);

            // CALL PlaceBid(..., OUT p_BidID)
            await conn.query(`CALL PlaceBid(?, ?, ?, ?, ?, @bidId)`, [a.AuctionID, userId, Number(amount), start, end]);
            const [[{ bidId }]] = await conn.query(`SELECT @bidId AS bidId`);

            // Lấy lại phiên để trả currentPrice mới
            const [[after]] = await conn.query(`
                SELECT b.Amount, a.MaxBidID
                FROM Auction a JOIN Bids b ON a.AuctionID = b.AuctionID AND a.MaxBidID = b.BidID
                WHERE a.AuctionID=?`, [a.AuctionID]);

            return {
                ok: true,
                bidId,
                currentPrice: after?.Amount ?? null,
                maxBidId: after?.MaxBidID ?? null
            };
        } catch (e) {
            throw e;
        } finally {
            conn.release();
        }
    }

    static async buyNow({ auctionUid, userId, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            const a = await this._getAuctionByUID(conn, auctionUid, /*forUpdate*/ false);
            if (!a) throw new Error('Auction not found');

            console.log(a);
           
            const ci = toDateStr(checkin);
            const co = toDateStr(checkout);

            await conn.query(
                `CALL PlaceBookingBuyNow(?, ?, ?, ?, @p_booking_id, @p_hold_expires_at)`,
                [userId, a.AuctionID, ci, co]
            );

            // Lấy OUT param
            const [[row]] = await conn.query(
                `SELECT @p_booking_id AS bookingId, @p_hold_expires_at AS holdExpiresAt`
            );

            const bookingId = row?.bookingId ?? null;
            if (!bookingId) throw new Error('BuyNow failed: booking not created');

            return { bookingId, holdExpiresAt: row?.holdExpiresAt || null };
        } catch (e) {
            throw e;
        } finally {
            conn.release();
        }
    }

    // === UPDATE STATUS ===
    static async setAuctionEnded(auctionUid) {
        const [result] = await pool.query(
            'UPDATE Auction SET Status = ? WHERE AuctionUID = ?',
            ['ended', auctionUid]
        );
        return result.affectedRows > 0;
    }
    
    static async getEndingSoonAuctions(limit = 15) {
        try {
            const safeLimit = parseInt(limit, 10);
            const query = `
                SELECT a.AuctionUID,
                        p.UID as ProductUID,
                        a.StartPrice,
                        b.Amount as CurrentPrice,
                        a.StayPeriodStart,
                        a.StayPeriodEnd,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        p.Name as ProductName,
                        rt.RoomTypeName,
                        p.Address,
                        p.ProvinceCode,
                        p.DistrictCode,
                        prov.Name AS ProvinceName,
                        dist.Name AS DistrictName,
                        ROUND((
                            COALESCE(p.CleanlinessPoint, 0) + 
                            COALESCE(p.LocationPoint, 0) + 
                            COALESCE(p.ServicePoint, 0) + 
                            COALESCE(p.ValuePoint, 0) + 
                            COALESCE(p.CommunicationPoint, 0) + 
                            COALESCE(p.ConveniencePoint, 0)
                        ) / 6, 2) AS AverageRating
                FROM Auction a
                JOIN Bids b ON b.BidID = a.MaxBidID
                JOIN Products p ON a.ProductID = p.ProductID
                LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                WHERE a.Status = 'active'
                ORDER BY a.EndTime ASC
                LIMIT ${safeLimit}
            `;
            const [auctions] = await pool.execute(query);
            console.log(`Fetched ending soon auctions:`, auctions);
            return auctions;
        } catch (error) {
            console.error('Error fetching ending soon auctions:', error);
            throw error;
        }
    }

    static async getFeaturedAuctions(limit = 15) {
        try {
            const safeLimit = parseInt(limit, 10);
            const query = `
                SELECT a.AuctionUID,
                        p.UID as ProductUID,
                        a.StartPrice,
                        b.Amount as CurrentPrice,
                        a.StayPeriodStart,
                        a.StayPeriodEnd,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        p.Name as ProductName,
                        rt.RoomTypeName,
                        p.Address,
                        p.ProvinceCode,
                        p.DistrictCode,
                        prov.Name AS ProvinceName,
                        dist.Name AS DistrictName,
                        ROUND((
                            COALESCE(p.CleanlinessPoint, 0) + 
                            COALESCE(p.LocationPoint, 0) + 
                            COALESCE(p.ServicePoint, 0) + 
                            COALESCE(p.ValuePoint, 0) + 
                            COALESCE(p.CommunicationPoint, 0) + 
                            COALESCE(p.ConveniencePoint, 0)
                        ) / 6, 2) AS AverageRating,
                        COALESCE(bid_count.BidCount, 0) AS BidCount
                FROM Auction a
                JOIN Bids b ON b.BidID = a.MaxBidID
                JOIN Products p ON a.ProductID = p.ProductID
                LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                LEFT JOIN (
                    SELECT AuctionID, COUNT(*) AS BidCount
                    FROM Bids
                    GROUP BY AuctionID
                ) bid_count ON a.AuctionID = bid_count.AuctionID
                WHERE a.Status = 'active'
                ORDER BY BidCount DESC
                LIMIT ${safeLimit}
            `;
            const [auctions] = await pool.execute(query);
            console.log(`Fetched featured auctions:`, auctions);
            return auctions;
        } catch (error) {
            console.error('Error fetching featured auctions:', error);
            throw error;
        }
    }

    static async getNewestAuctions(limit = 15) {
        try {
            const safeLimit = parseInt(limit, 10);
            const query = `
                SELECT a.AuctionUID,
                        p.UID as ProductUID,
                        a.StartPrice,
                        b.Amount as CurrentPrice,
                        a.StayPeriodStart,
                        a.StayPeriodEnd,
                        a.StartTime,
                        a.EndTime,
                        a.Status,
                        p.Name as ProductName,
                        rt.RoomTypeName,
                        p.Address,
                        p.ProvinceCode,
                        p.DistrictCode,
                        prov.Name AS ProvinceName,
                        dist.Name AS DistrictName,
                        ROUND((
                            COALESCE(p.CleanlinessPoint, 0) + 
                            COALESCE(p.LocationPoint, 0) + 
                            COALESCE(p.ServicePoint, 0) + 
                            COALESCE(p.ValuePoint, 0) + 
                            COALESCE(p.CommunicationPoint, 0) + 
                            COALESCE(p.ConveniencePoint, 0)
                        ) / 6, 2) AS AverageRating
                FROM Auction a
                JOIN Products p ON a.ProductID = p.ProductID
                JOIN Bids b ON b.BidID = a.MaxBidID
                LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                WHERE a.Status = 'active'
                ORDER BY a.StartTime DESC
                LIMIT ${safeLimit}
            `;
            const [auctions] = await pool.execute(query);
            console.log(`Fetched newest auctions:`, auctions);
            return auctions;
        } catch (error) {
            console.error('Error fetching newest auctions:', error);
            throw error;
        }
    }

    // Admin
    static async getAllAuctionsForAdmin(limit, offset) {
        const safeLimit = parseInt(limit, 10);
        const safeOffset = parseInt(offset, 10);
        try {
            const query = `
                SELECT 
                    a.AuctionID,
                    a.AuctionUID,
                    a.ProductID,
                    a.StayPeriodStart,
                    a.StayPeriodEnd,
                    a.StartTime,
                    a.EndTime,
                    a.Status,
                    b.Amount as CurrentPrice
                FROM Auction a
                JOIN Bids b ON b.BidID = a.MaxBidID
                ORDER BY 
                    CASE a.Status
                        WHEN 'active'    THEN 1
                        WHEN 'ended'     THEN 2
                        WHEN 'cancelled' THEN 3
                    END,
                    a.StartTime DESC
                LIMIT ${safeLimit} OFFSET ${safeOffset}
            `;
            const [auctions] = await pool.execute(query);
            return auctions;
        } catch (error) {
            console.error('Error fetching all auctions for admin:', error);
            throw error;
        }
    }

    static async getAllAuctionsByStatusForAdmin(status, limit, offset) {
        const safeLimit = parseInt(limit, 10);
        const safeOffset = parseInt(offset, 10);
        try {
            const query = `
                SELECT 
                    a.AuctionID,
                    a.AuctionUID,
                    a.ProductID,
                    a.StayPeriodStart,
                    a.StayPeriodEnd,
                    a.StartTime,
                    a.EndTime,
                    a.Status,
                    b.Amount as CurrentPrice
                FROM Auction a
                JOIN Bids b ON b.BidID = a.MaxBidID
                WHERE a.Status = ?
                ORDER BY 
                    CASE a.Status
                        WHEN 'active'    THEN 1
                        WHEN 'ended'     THEN 2
                        WHEN 'cancelled' THEN 3
                    END,
                    a.StartTime DESC
                LIMIT ${safeLimit} OFFSET ${safeOffset}
            `;
            const [auctions] = await pool.execute(query, [status]);
            return auctions;
        } catch (error) {
            console.error('Error fetching all auctions by status for admin:', error);
            throw error;
        }
    }

    static async searchAuctionsByUID(uid) {
        const query = `
            SELECT 
                a.AuctionID,
                a.AuctionUID,
                a.ProductID,
                a.StayPeriodStart,
                a.StayPeriodEnd,
                a.StartTime,
                a.EndTime,
                a.Status,
                b.Amount as CurrentPrice
            FROM Auction a
            JOIN Bids b ON b.BidID = a.MaxBidID
            WHERE a.AuctionUID = ?
        `;
        const [auctions] = await pool.execute(query, [uid]);
        return auctions;
    }

    // Lấy chi tiết auction cho admin
    static async getAuctionDetailsForAdmin(auctionUID) {
        try {
            const query = `
                SELECT 
                    a.AuctionID,
                    a.AuctionUID,
                    a.ProductID,
                    p.UID AS ProductUID,
                    p.Name AS ProductName,
                    a.StayPeriodStart,
                    a.StayPeriodEnd,
                    a.StartTime,
                    a.EndTime,
                    a.MaxBidID,
                    a.StartPrice,
                    a.BidIncrement,
                    a.Status,
                    a.EndReason,
                    b.Amount AS CurrentPrice,
                    p.Price AS BasePrice,
                    p.PropertyType,
                    p.Address,
                    p.ProvinceCode,
                    pr.FullName AS ProvinceName,
                    p.DistrictCode,
                    d.FullName AS DistrictName,
                    rt.RoomTypeName,
                    pt.PropertyName,
                    COUNT(b.BidID) AS TotalBids
                FROM Auction a
                JOIN Products p ON a.ProductID = p.ProductID
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                JOIN Districts d ON p.DistrictCode = d.DistrictCode
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                LEFT JOIN Properties pt ON p.PropertyType = pt.PropertyID
                LEFT JOIN Bids b ON a.MaxBidID = b.BidID
                WHERE a.AuctionUID = ?
                GROUP BY a.AuctionID
            `;
            const [rows] = await pool.execute(query, [auctionUID]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching auction details for admin:', error);
            throw error;
        }
    }

    // Cập nhật status của auction
    static async updateAuctionStatus(auctionUID, newStatus, endReason = null) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Kiểm tra auction tồn tại
            const [auctionRows] = await connection.execute(
                'SELECT AuctionID, Status FROM Auction WHERE AuctionUID = ?',
                [auctionUID]
            );

            if (auctionRows.length === 0) {
                throw new Error('Auction not found');
            }

            const auction = auctionRows[0];
            const currentStatus = auction.Status;

            // Validate status transition
            const validTransitions = {
                'active': ['cancelled']
                // 'active': ['ended', 'cancelled'],
                // 'ended': [],
                // 'cancelled': ['active']
            };

            if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
                throw new Error(`Cannot change status from ${currentStatus} to ${newStatus}`);
            }

            // Cập nhật status
            let updateQuery = 'UPDATE Auction SET Status = ?';
            let params = [newStatus];

            if (endReason && (newStatus === 'cancelled')) {
                updateQuery += ', EndReason = ?';
                params.push(endReason);
            }

            updateQuery += ' WHERE AuctionUID = ?';
            params.push(auctionUID);

            await connection.execute(updateQuery, params);

            await connection.commit();
            return { success: true, message: `Auction status updated to ${newStatus}` };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = AuctionModel;
