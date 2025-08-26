const pool = require('../config/database');

// Thống kê tổng quan
const getDashboardStats = async (req, res) => {
    try {
        // Thống kê tổng số
        const [totalStats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM Users WHERE Role = 'guest') as totalUsers,
                (SELECT COUNT(*) FROM Products WHERE is_deleted = 0) as totalProducts,
                (SELECT COUNT(*) FROM Auction) as totalAuctions,
                (SELECT COUNT(*) FROM Booking) as totalBookings,
                (SELECT COUNT(*) FROM Booking WHERE BookingStatus = 'completed') as completedBookings,
                (SELECT COALESCE(SUM(Amount), 0) FROM Booking WHERE BookingStatus = 'completed') as totalRevenue
        `);

        // Thống kê booking theo trạng thái
        const [bookingByStatus] = await pool.execute(`
            SELECT 
                BookingStatus as status,
                COUNT(*) as count,
                COALESCE(SUM(Amount), 0) as totalAmount
            FROM Booking 
            GROUP BY BookingStatus
        `);

        // Thống kê sản phẩm theo loại
        const [productsByType] = await pool.execute(`
            SELECT 
                rt.RoomTypeName as type,
                COUNT(p.ProductID) as count
            FROM Products p
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            WHERE p.is_deleted = 0
            GROUP BY p.RoomType, rt.RoomTypeName
            ORDER BY count DESC
        `);

        // Thống kê auction theo trạng thái
        const [auctionByStatus] = await pool.execute(`
            SELECT 
                Status as status,
                COUNT(*) as count
            FROM Auction
            GROUP BY Status
        `);

        res.json({
            success: true,
            data: {
                totalStats: totalStats[0],
                bookingByStatus,
                productsByType,
                auctionByStatus
            }
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê dashboard',
            error: error.message
        });
    }
};

// Thống kê doanh thu theo thời gian
const getRevenueStats = async (req, res) => {
    try {
        const { period = 'month', year = new Date().getFullYear() } = req.query;

        let query, groupBy, dateFormat;

        if (period === 'day') {
            // Thống kê theo ngày trong tháng hiện tại
            const currentMonth = new Date().getMonth() + 1;
            query = `
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
            `;
            const [dailyStats] = await pool.execute(query, [year, currentMonth]);
            return res.json({ success: true, data: dailyStats });

        } else if (period === 'month') {
            // Thống kê theo tháng trong năm
            query = `
                SELECT 
                    MONTH(CreatedAt) as period,
                    COUNT(*) as bookings,
                    COALESCE(SUM(Amount), 0) as revenue
                FROM Booking 
                WHERE YEAR(CreatedAt) = ? 
                    AND BookingStatus = 'completed'
                GROUP BY MONTH(CreatedAt)
                ORDER BY period
            `;
            const [monthlyStats] = await pool.execute(query, [year]);
            return res.json({ success: true, data: monthlyStats });

        } else if (period === 'year') {
            // Thống kê theo năm
            query = `
                SELECT 
                    YEAR(CreatedAt) as period,
                    COUNT(*) as bookings,
                    COALESCE(SUM(Amount), 0) as revenue
                FROM Booking 
                WHERE BookingStatus = 'completed'
                GROUP BY YEAR(CreatedAt)
                ORDER BY period DESC
                LIMIT 5
            `;
            const [yearlyStats] = await pool.execute(query);
            return res.json({ success: true, data: yearlyStats });
        }

    } catch (error) {
        console.error('Error getting revenue stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê doanh thu',
            error: error.message
        });
    }
};

// Thống kê khách hàng
const getCustomerStats = async (req, res) => {
    try {
        // Khách hàng mới theo tháng
        const [newCustomers] = await pool.execute(`
            SELECT 
                MONTH(CreatedAt) as month,
                COUNT(*) as count
            FROM Users 
            WHERE YEAR(CreatedAt) = YEAR(CURRENT_DATE())
                AND Role = 'guest'
            GROUP BY MONTH(CreatedAt)
            ORDER BY month
        `);

        // Top khách hàng theo số booking
        const [topCustomers] = await pool.execute(`
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

        // Thống kê theo trạng thái user
        const [usersByStatus] = await pool.execute(`
            SELECT 
                Status as status,
                COUNT(*) as count
            FROM Users
            WHERE Role = 'guest'
            GROUP BY Status
        `);

        res.json({
            success: true,
            data: {
                newCustomers,
                topCustomers,
                usersByStatus
            }
        });
    } catch (error) {
        console.error('Error getting customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê khách hàng',
            error: error.message
        });
    }
};

// Thống kê sản phẩm
const getProductStats = async (req, res) => {
    try {
        // Top sản phẩm được đặt nhiều nhất
        const [topProducts] = await pool.execute(`
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

        // Sản phẩm theo tỉnh
        const [productsByProvince] = await pool.execute(`
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

        // Thống kê giá trung bình theo loại phòng
        const [avgPriceByType] = await pool.execute(`
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

        res.json({
            success: true,
            data: {
                topProducts,
                productsByProvince,
                avgPriceByType
            }
        });
    } catch (error) {
        console.error('Error getting product stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê sản phẩm',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueStats,
    getCustomerStats,
    getProductStats
};
