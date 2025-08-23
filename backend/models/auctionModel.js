const pool = require('../config/database');
const { MongoClient } = require('mongodb');

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

    static async getEndingSoonAuctions(limit = 15) {
        try {
            const safeLimit = parseInt(limit, 10);
            const query = `
                SELECT a.AuctionUID,
                        p.UID as ProductUID,
                        a.StartPrice,
                        a.CurrentPrice,
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
                        a.CurrentPrice,
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
                        a.CurrentPrice,
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
}

module.exports = AuctionModel;