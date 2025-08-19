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
}

module.exports = AuctionModel;