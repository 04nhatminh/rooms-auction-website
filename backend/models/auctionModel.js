const pool = require('../config/database');
const { MongoClient } = require('mongodb');

function toDateStr(d) {
  const x = (d instanceof Date) ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`;
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

function daysBetween(from, to) { return Math.floor((new Date(to) - new Date(from))/86400000); }

function roundTo(x, step) { return step ? Math.round(x/step)*step : Math.round(x); }

function genAuctionUIDNumeric() {
  // 18 chữ số: epoch ms (13) + 5 số ngẫu nhiên ⇒ BIGINT UNSIGNED an toàn
  const base = Date.now().toString();
  let rnd = ''; while (rnd.length < 5) rnd += Math.floor(Math.random()*10);
  return base + rnd.slice(0,5);
}


class AuctionModel {
    static async getAuctionDetails(auctionID) {
        try {
            const query = `
                SELECT a.AuctionUID,
                        a.StayPeriodStart,
                        a.StayPeriodEnd,
                        a.StartTime,
                        a.EndTime,
                        a.InstantPrice,
                        a.StartPrice,
                        a.BidIncrement,
                        a.CurrentPrice,
                        a.Status,
                        P.Name as ProductName,
                        p.UID as ProductUID,
                        p.ProvinceCode,
                        pr.Name as ProvinceName,
                        p.DistrictCode,
                        d.Name as DistrictName,
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
                JOIN Products p ON a.ProductID = p.ProductID
                JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                JOIN Districts d ON p.DistrictCode = d.DistrictCode
                WHERE a.AuctionID = ?
            `;
            const [auctions] = await pool.execute(query, [auctionID]);
            console.log(`Fetched auction details for AuctionID ${auctionID}:`, auctions);
            return auctions[0]; // Trả về phiên đấu giá đầu tiên
        } catch (error) {
            console.error('Error fetching auction details:', error);
            throw error; // Ném lỗi để xử lý ở nơi gọi
        }
    }

    static async getAuctionsByProvinceByStatus(provinceCode, status, limit = 15) {
        try {
            const query = `
                SELECT a.AuctionUID,
                       p.UID as ProductUID,
                       a.StayPeriodStart,
                       a.StayPeriodEnd,
                       a.StartTime,
                       a.EndTime,
                       a.StartPrice,
                       a.CurrentPrice,
                       pr.Name AS ProvinceName,
                       d.Name AS DistrictName,
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
                WHERE p.ProvinceCode = ? AND a.Status = ?
                LIMIT ${limit}
            `;
            const [auctions] = await pool.execute(query, [provinceCode, status]);
            console.log(`Fetched auctions for ProvinceCode ${provinceCode} and Status ${status}:`, auctions);
            return auctions;
        } catch (error) {
            console.error('Error fetching auctions by province:', error);
            throw error;
        }
    }

    static async getAuctionsByDistrictByStatus(districtCode, status, limit = 15) {
        try {
            const query = `
                SELECT a.AuctionUID,
                       a.ProductID,
                       a.StayPeriodStart,
                       a.StayPeriodEnd,
                       a.StartTime,
                       a.EndTime,
                       a.StartPrice,
                       a.CurrentPrice,
                       a.Status,
                       pr.Name AS ProvinceName,
                       d.Name AS DistrictName,
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
                WHERE p.DistrictCode = ? AND a.Status = ?
                LIMIT ${limit}
            `;
            const [auctions] = await pool.execute(query, [districtCode, status]);
            console.log(`Fetched auctions for DistrictCode ${districtCode} and Status ${status}:`, auctions);
            return auctions;
        } catch (error) {
            console.error('Error fetching auctions by district:', error);
            throw error;
        }
    }

    static async _getParams(conn) {
        const [rows] = await conn.query(
            `SELECT
            CAST(MAX(CASE WHEN ParamName='BidLeadTimeDays'     THEN ParamValue END) AS SIGNED)        AS BidLeadTimeDays,
            CAST(MAX(CASE WHEN ParamName='AuctionDurationDays' THEN ParamValue END) AS SIGNED)        AS AuctionDurationDays,
            CAST(MAX(CASE WHEN ParamName='StartPriceFactor'    THEN ParamValue END) AS DECIMAL(10,4)) AS StartPriceFactor,
            CAST(MAX(CASE WHEN ParamName='BidIncrementFactor'  THEN ParamValue END) AS DECIMAL(10,4)) AS BidIncrementFactor
            FROM SystemParameters`
        );
        return rows[0];
    }

    static async _hasActiveOverlap(conn, productId, start, end) {
        const [rows] = await conn.query(
            `SELECT 1 FROM Auction
            WHERE ProductID=? AND Status='active'
                AND NOT (StayPeriodEnd <= ? OR StayPeriodStart >= ?)
            LIMIT 1`,
            [productId, toDateStr(start), toDateStr(end)]
        );
        return rows.length > 0;
    }

    static async previewCreate({ productUid, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            const start = toDateStr(checkin), end = toDateStr(checkout), today = toDateStr(new Date());
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
        } finally { conn.release(); }
    }

    static async createAuction({ productUid, userId, checkin, checkout }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const params = await this._getParams(conn);
            const start = toDateStr(checkin), end = toDateStr(checkout), today = toDateStr(new Date());

            const [[prod]] = await conn.query(`SELECT ProductID, Price, Currency FROM Products WHERE UID=?`, [productUid]);
            if (!prod) throw new Error('Product not found');
            const productId = prod.ProductID;

            const leadOk = daysBetween(today, start) >= Number(params.BidLeadTimeDays ?? 0);
            if (!leadOk) throw new Error('Not enough lead time');

            const overlap = await this._hasActiveOverlap(conn, productId, start, end);
            if (overlap) throw new Error('Active auction already exists for this period');

            const base = Number(prod.Price || 0);
            const startPrice   = roundTo(base * Number(params.StartPriceFactor ?? 0.7), 1000);
            const bidIncrement = Math.max(roundTo(base * Number(params.BidIncrementFactor ?? 0.05), 1000), 1000);
            const startTime    = new Date();
            const endTime      = addDays(startTime, Number(params.AuctionDurationDays ?? 5));
            const auctionUid   = genAuctionUIDNumeric();

            const [r] = await conn.query(
            `INSERT INTO Auction
            (AuctionUID, ProductID, StayPeriodStart, StayPeriodEnd, StartTime, EndTime,
                StartPrice, BidIncrement, CurrentPrice, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [auctionUid, productId, start, end, startTime, endTime, startPrice, bidIncrement, startPrice]
            );
            const auctionId = r.insertId;

            // Block Calendar [start, end) với LockReason='auction'
            for (let d = new Date(start); d < new Date(end); d.setDate(d.getDate()+1)) {
            const day = toDateStr(d);
            await conn.query(
                `INSERT INTO Calendar (ProductID, Day, Status, LockReason, AuctionID)
                VALUES (?, ?, 'blocked', 'auction', ?)
                ON DUPLICATE KEY UPDATE Status='blocked', LockReason='auction', AuctionID=?`,
                [productId, day, auctionId, auctionId]
            );
            }

            await conn.commit();
            return { auctionUid, endTime, currentPrice: startPrice, currency: prod.Currency };
        } catch (e) {
            await conn.rollback(); throw e;
        } finally { conn.release(); }
    }

    static async getByUID(auctionUid) {
        const [rows] = await pool.query(
            `SELECT A.*, P.UID AS ProductUID, P.Name AS ProductName, P.Price AS BasePrice, P.Currency
            FROM Auction A
            JOIN Products P ON P.ProductID=A.ProductID
            WHERE A.AuctionUID=?`,
            [auctionUid]
        );
        if (!rows.length) return null;

        const a = rows[0];
        const [fullHistory] = await pool.query(
            `SELECT B.BidID, B.Amount, B.BidTime, U.FullName
            FROM Bids B LEFT JOIN Users U ON U.UserID = B.UserID
            WHERE B.AuctionID=? ORDER BY B.BidTime DESC`,
            [a.AuctionID]
        );

        return {
            auction: {
            auctionUid: String(a.AuctionUID),
            productUid: a.ProductUID,
            stayPeriod: { start: a.StayPeriodStart, end: a.StayPeriodEnd },
            startTime: a.StartTime, endTime: a.EndTime,
            startPrice: a.StartPrice, bidIncrement: a.BidIncrement,
            currentPrice: a.CurrentPrice, status: a.Status
            },
            room: { name: a.ProductName, basePrice: a.BasePrice, currency: a.Currency },
            fullHistory
        };
    }

    static async placeBid({ auctionUid, userId, amount }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [[a]] = await conn.query(`SELECT * FROM Auction WHERE AuctionUID=? FOR UPDATE`, [auctionUid]);
            if (!a) throw new Error('Auction not found');
            if (a.Status !== 'active' || new Date() >= new Date(a.EndTime)) throw new Error('Auction ended');

            const minAccept = Number(a.CurrentPrice) + Number(a.BidIncrement);
            if (Number(amount) < minAccept) throw new Error(`Bid too low (>= ${minAccept})`);

            const [ins] = await conn.query(
            `INSERT INTO Bids (AuctionID, UserID, Amount, BidTime) VALUES (?,?,?,NOW())`,
            [a.AuctionID, userId, amount]
            );
            await conn.query(
            `UPDATE Auction SET CurrentPrice=?, MaxBidID=? WHERE AuctionID=?`,
            [amount, ins.insertId, a.AuctionID]
            );

            await conn.commit();
            return { ok: true, currentPrice: amount };
        } catch (e) { await conn.rollback(); throw e; }
        finally { conn.release(); }
    }

}

module.exports = AuctionModel;