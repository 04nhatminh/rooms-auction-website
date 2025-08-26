const pool = require('../config/database');

class StatisticsModel {
    // Thống kê tổng quan
    static async getTotalStats() {
        const [result] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM Users WHERE Role = 'guest') as totalUsers,
                (SELECT COUNT(*) FROM Products WHERE is_deleted = 0) as totalProducts,
                (SELECT COUNT(*) FROM Auction) as totalAuctions,
                (SELECT COUNT(*) FROM Booking) as totalBookings,
                (SELECT COUNT(*) FROM Booking WHERE BookingStatus = 'completed') as completedBookings,
                (SELECT COALESCE(SUM(Amount), 0) FROM Booking WHERE BookingStatus = 'completed') as totalRevenue
        `);
        return result[0];
    }

    // Thống kê booking theo trạng thái
    static async getBookingByStatus() {
        const [result] = await pool.execute(`
            SELECT 
                BookingStatus as status,
                COUNT(*) as count,
                COALESCE(SUM(Amount), 0) as totalAmount
            FROM Booking 
            GROUP BY BookingStatus
        `);
        return result;
    }

    // Thống kê sản phẩm theo loại
    static async getProductsByType() {
        const [result] = await pool.execute(`
            SELECT 
                rt.RoomTypeName as type,
                COUNT(p.ProductID) as count
            FROM Products p
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            WHERE p.is_deleted = 0
            GROUP BY p.RoomType, rt.RoomTypeName
            ORDER BY count DESC
        `);
        return result;
    }

    // Thống kê auction theo trạng thái
    static async getAuctionByStatus() {
        const [result] = await pool.execute(`
            SELECT 
                Status as status,
                COUNT(*) as count
            FROM Auction
            GROUP BY Status
        `);
        return result;
    }

    // Thống kê doanh thu theo ngày
    static async getRevenueByDay(year, month) {
        const [result] = await pool.execute(`
            SELECT 
                DAY(CreatedAt) as period,
                COUNT(*) as bookings,
                COALESCE(SUM(Amount), 0) as revenue
            FROM Booking 
            WHERE YEAR(CreatedAt) = ? 
                AND MONTH(CreatedAt) = ?
                AND BookingStatus = 'completed'
            GROUP BY DAY(CreatedAt)
            ORDER BY period
        `, [year, month]);
        return result;
    }

    // Thống kê doanh thu theo tháng
    static async getRevenueByMonth(year) {
        const [result] = await pool.execute(`
            SELECT 
                MONTH(CreatedAt) as period,
                COUNT(*) as bookings,
                COALESCE(SUM(Amount), 0) as revenue
            FROM Booking 
            WHERE YEAR(CreatedAt) = ? 
                AND BookingStatus = 'completed'
            GROUP BY MONTH(CreatedAt)
            ORDER BY period
        `, [year]);
        return result;
    }

    // Thống kê doanh thu theo năm
    static async getRevenueByYear() {
        const [result] = await pool.execute(`
            SELECT 
                YEAR(CreatedAt) as period,
                COUNT(*) as bookings,
                COALESCE(SUM(Amount), 0) as revenue
            FROM Booking 
            WHERE BookingStatus = 'completed'
            GROUP BY YEAR(CreatedAt)
            ORDER BY period DESC
            LIMIT 5
        `);
        return result;
    }

    // Khách hàng mới theo tháng
    static async getNewCustomersByMonth(year) {
        const [result] = await pool.execute(`
            SELECT 
                MONTH(CreatedAt) as month,
                COUNT(*) as count
            FROM Users 
            WHERE YEAR(CreatedAt) = ?
                AND Role = 'guest'
            GROUP BY MONTH(CreatedAt)
            ORDER BY month
        `, [year]);
        return result;
    }

    // Top khách hàng theo số booking
    static async getTopCustomers() {
        const [result] = await pool.execute(`
            SELECT 
                u.UserID,
                u.FullName,
                u.Email,
                COUNT(b.BookingID) as totalBookings,
                COALESCE(SUM(b.Amount), 0) as totalSpent
            FROM Users u
            LEFT JOIN Booking b ON u.UserID = b.UserID AND b.BookingStatus = 'completed'
            WHERE u.Role = 'guest'
            GROUP BY u.UserID, u.FullName, u.Email
            HAVING totalBookings > 0
            ORDER BY totalBookings DESC, totalSpent DESC
            LIMIT 10
        `);
        return result;
    }

    // Thống kê khách hàng theo trạng thái
    static async getUsersByStatus() {
        const [result] = await pool.execute(`
            SELECT 
                Status as status,
                COUNT(*) as count
            FROM Users
            WHERE Role = 'guest'
            GROUP BY Status
        `);
        return result;
    }

    // Top sản phẩm được đặt nhiều nhất
    static async getTopProducts() {
        const [result] = await pool.execute(`
            SELECT 
                p.ProductID,
                p.Name,
                p.Address,
                COUNT(b.BookingID) as totalBookings,
                COALESCE(SUM(b.Amount), 0) as totalRevenue,
                rt.RoomTypeName,
                prov.Name as ProvinceName
            FROM Products p
            LEFT JOIN Booking b ON p.ProductID = b.ProductID AND b.BookingStatus = 'completed'
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
            WHERE p.is_deleted = 0
            GROUP BY p.ProductID, p.Name, p.Address, rt.RoomTypeName, prov.Name
            HAVING totalBookings > 0
            ORDER BY totalBookings DESC, totalRevenue DESC
            LIMIT 10
        `);
        return result;
    }

    // Sản phẩm theo tỉnh
    static async getProductsByProvince() {
        const [result] = await pool.execute(`
            SELECT 
                prov.Name as province,
                COUNT(p.ProductID) as count
            FROM Products p
            LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
            WHERE p.is_deleted = 0
            GROUP BY p.ProvinceCode, prov.Name
            ORDER BY count DESC
            LIMIT 10
        `);
        return result;
    }

    // Thống kê giá trung bình theo loại phòng
    static async getAvgPriceByType() {
        const [result] = await pool.execute(`
            SELECT 
                rt.RoomTypeName as type,
                COUNT(p.ProductID) as count,
                ROUND(AVG(p.Price), 2) as avgPrice,
                MIN(p.Price) as minPrice,
                MAX(p.Price) as maxPrice
            FROM Products p
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            WHERE p.is_deleted = 0 AND p.Price > 0
            GROUP BY p.RoomType, rt.RoomTypeName
            ORDER BY avgPrice DESC
        `);
        return result;
    }

    // Thống kê booking theo ngày
    static async getBookingByDay(year, month) {
        const [result] = await pool.execute(`
            SELECT 
                DAY(CreatedAt) as period,
                COUNT(*) as bookings
            FROM Booking 
            WHERE YEAR(CreatedAt) = ? 
                AND MONTH(CreatedAt) = ?
            GROUP BY DAY(CreatedAt)
            ORDER BY period
        `, [year, month]);
        return result;
    }

    // Thống kê booking theo tháng
    static async getBookingByMonth(year) {
        const [result] = await pool.execute(`
            SELECT 
                MONTH(CreatedAt) as period,
                COUNT(*) as bookings
            FROM Booking 
            WHERE YEAR(CreatedAt) = ?
            GROUP BY MONTH(CreatedAt)
            ORDER BY period
        `, [year]);
        return result;
    }

    // Thống kê booking theo năm
    static async getBookingByYear() {
        const [result] = await pool.execute(`
            SELECT 
                YEAR(CreatedAt) as period,
                COUNT(*) as bookings
            FROM Booking 
            GROUP BY YEAR(CreatedAt)
            ORDER BY period DESC
            LIMIT 5
        `);
        return result;
    }

    // Thống kê bids theo ngày
    static async getBidsByDay(year, month) {
        const [result] = await pool.execute(`
            SELECT 
                DAY(BidTime) as period,
                COUNT(*) as bids
            FROM Bids 
            WHERE YEAR(BidTime) = ? 
                AND MONTH(BidTime) = ?
            GROUP BY DAY(BidTime)
            ORDER BY period
        `, [year, month]);
        return result;
    }

    // Thống kê bids theo tháng
    static async getBidsByMonth(year) {
        const [result] = await pool.execute(`
            SELECT 
                MONTH(BidTime) as period,
                COUNT(*) as bids
            FROM Bids 
            WHERE YEAR(BidTime) = ?
            GROUP BY MONTH(BidTime)
            ORDER BY period
        `, [year]);
        return result;
    }

    // Thống kê bids theo năm
    static async getBidsByYear() {
        const [result] = await pool.execute(`
            SELECT 
                YEAR(BidTime) as period,
                COUNT(*) as bids
            FROM Bids 
            GROUP BY YEAR(BidTime)
            ORDER BY period DESC
            LIMIT 5
        `);
        return result;
    }
}

module.exports = StatisticsModel;
