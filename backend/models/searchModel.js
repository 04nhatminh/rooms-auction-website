const pool = require('../config/database');

exports.searchRooms = async (params) => {
    const {
        province,
        district,
        guests,
        popular,
        sort,
        price_min,
        price_max,
        room_types,
        rating,
        limit,
        offset
    } = params;

    let sql = `
        SELECT p.ProductID,
                p.UID,
                p.ExternalID,
                p.Name,
                p.Address,
                prov.Name AS ProvinceName,
                dist.Name AS DistrictName,
                p.ProvinceCode,
                p.DistrictCode,
                rt.RoomTypeName,
                p.Price,
                p.Currency,
                p.CleanlinessPoint,
                p.LocationPoint,
                p.ServicePoint,
                p.ValuePoint,
                p.CommunicationPoint,
                p.ConveniencePoint,
                ROUND((
                        COALESCE(p.CleanlinessPoint, 0) + 
                        COALESCE(p.LocationPoint, 0) + 
                        COALESCE(p.ServicePoint, 0) + 
                        COALESCE(p.ValuePoint, 0) + 
                        COALESCE(p.CommunicationPoint, 0) + 
                        COALESCE(p.ConveniencePoint, 0)
                    ) / 6, 2) AS AverageRating
        FROM Products p
        LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
        LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
        LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
        WHERE 1=1
    `;
    const values = [];

    // Location filter
    if (province) {
        sql += " AND p.ProvinceCode = ? ";
        values.push(province);
    }
    if (district) {
        sql += " AND p.DistrictCode = ? ";
        values.push(district);
    }

    // Guests filter
    if (guests) {
        sql += " AND p.MaxGuests >= ? ";
        values.push(guests);
    }

    // Price range filter
    if (price_min) {
        sql += " AND p.Price >= ? ";
        values.push(price_min);
    }
    if (price_max) {
        sql += " AND p.Price <= ? ";
        values.push(price_max);
    }

    // Room type filter
    if (room_types) {
        const types = room_types.split(","); // ví dụ "1,2,3"
        sql += ` AND p.RoomType IN (${types.map(() => "?").join(",")}) `;
        values.push(...types);
    }

    // Sort and popular, but handle HAVING clause properly
    let orderByClause = "";
    let havingClause = "";

    // Rating filter
    if (rating) {
        havingClause = " HAVING AverageRating >= ? ";
        values.push(rating);
    }

    // Sort clause
    if (popular) {
        // Popular: rating cao trước
        if (sort === "price_asc") {
            orderByClause = " ORDER BY p.Price ASC, AverageRating DESC ";
        } else if (sort === "price_desc") {
            orderByClause = " ORDER BY p.Price DESC, AverageRating DESC ";
        } else {
            // Mặc định sort theo rating cao nhất khi popular
            orderByClause = " ORDER BY AverageRating DESC, p.ProductID ASC ";
        }
    } else { // newest
        // Newest: sản phẩm mới nhất trước (theo ProductID hoặc ngày tạo)
        if (sort === "price_asc") {
            orderByClause = " ORDER BY p.Price ASC, p.ProductID DESC ";
        } else if (sort === "price_desc") {
            orderByClause = " ORDER BY p.Price DESC, p.ProductID DESC ";
        } else {
            // Mặc định sort theo ProductID giảm dần (mới nhất trước)
            orderByClause = " ORDER BY p.ProductID DESC ";
        }
    }

    // Add HAVING and ORDER BY clauses
    sql += havingClause + orderByClause;

    // Pagination
    sql += ` LIMIT ${limit} OFFSET ${offset} `;
    
    const [rows] = await pool.execute(sql, values);
    return rows;
};

exports.countSearchRooms = async (params) => {
    const {
        province,
        district,
        guests,
        price_min,
        price_max,
        room_types,
        rating
    } = params;

    let sql = `
        SELECT COUNT(*) as total FROM (
            SELECT p.ProductID,
                ROUND((
                    COALESCE(p.CleanlinessPoint, 0) + 
                    COALESCE(p.LocationPoint, 0) + 
                    COALESCE(p.ServicePoint, 0) + 
                    COALESCE(p.ValuePoint, 0) + 
                    COALESCE(p.CommunicationPoint, 0) + 
                    COALESCE(p.ConveniencePoint, 0)
                ) / 6, 2) AS AverageRating
            FROM Products p
            LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
            LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
            LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
            WHERE 1=1
    `;

    const values = [];

    // Location filter
    if (province) {
        sql += " AND p.ProvinceCode = ? ";
        values.push(province);
    }
    if (district) {
        sql += " AND p.DistrictCode = ? ";
        values.push(district);
    }

    // Guests filter
    if (guests) {
        sql += " AND p.MaxGuests >= ? ";
        values.push(guests);
    }

    // Price range filter
    if (price_min) {
        sql += " AND p.Price >= ? ";
        values.push(price_min);
    }
    if (price_max) {
        sql += " AND p.Price <= ? ";
        values.push(price_max);
    }

    // Room type filter
    if (room_types) {
        const types = room_types.split(",");
        sql += ` AND p.RoomType IN (${types.map(() => "?").join(",")}) `;
        values.push(...types);
    }

    sql += " ) as sub ";

    // Rating filter
    if (rating) {
        sql += " WHERE sub.AverageRating >= ? ";
        values.push(rating);
    }

    const [rows] = await pool.execute(sql, values);
    return rows[0].total;
};



exports.searchAuctions = async (params) => {
    const {
        province,
        district,
        status,
        sort,
        price_min,
        price_max,
        room_types,
        auction_types,
        rating,
        popular,
        limit,
        offset
    } = params;

    let sql = `
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
        WHERE 1=1
    `;
    const values = [];

    // Location filter
    if (province) {
        sql += " AND p.ProvinceCode = ? ";
        values.push(province);
    }
    if (district) {
        sql += " AND p.DistrictCode = ? ";
        values.push(district);
    }

    // Status filter
    if (status) {
        sql += " AND a.Status = ? ";
        values.push(status);
    }

    // Price range filter (based on current bid or start price)
    if (price_min) {
        sql += " AND COALESCE(a.CurrentPrice, a.StartPrice) >= ? ";
        values.push(price_min);
    }
    if (price_max) {
        sql += " AND COALESCE(a.CurrentPrice, a.StartPrice) <= ? ";
        values.push(price_max);
    }

    // Room type filter
    if (room_types) {
        const types = room_types.split(","); // ví dụ "1,2,3"
        sql += ` AND p.RoomType IN (${types.map(() => "?").join(",")}) `;
        values.push(...types);
    }

    // Sort and popular, but handle HAVING clause properly
    let havingClause = "";

    // Rating filter
    if (rating) {
        havingClause = " HAVING AverageRating >= ? ";
        values.push(rating);
    }

    sql += havingClause;

    // Auction types filter (endingSoon, featured, newest)
    if (auction_types) {
        const types = auction_types.split(",");
        
        if (types.includes('endingSoon')) {
            sql += " AND a.EndTime <= DATE_ADD(NOW(), INTERVAL 24 HOUR) ";
        }
        // Note: 'featured' and 'newest' would need additional columns in database
        // For now, we'll sort by EndTime for endingSoon
    }

    // Sort
    if (popular) {
        // Popular: rating cao trước
        if (sort === "price_asc") {
            sql += " ORDER BY COALESCE(a.CurrentPrice, a.StartPrice) ASC, AverageRating DESC ";
        } else if (sort === "price_desc") {
            sql += " ORDER BY COALESCE(a.CurrentPrice, a.StartPrice) DESC, AverageRating DESC ";
        } else if (auction_types && auction_types.includes('endingSoon')) {
            sql += " ORDER BY a.EndTime ASC, AverageRating DESC ";
        } else {
            sql += " ORDER BY AverageRating DESC, a.AuctionUID DESC ";
        }
    } else { // newest
        // Newest: auction mới nhất trước
        if (sort === "price_asc") {
            sql += " ORDER BY COALESCE(a.CurrentPrice, a.StartPrice) ASC, a.AuctionUID DESC ";
        } else if (sort === "price_desc") {
            sql += " ORDER BY COALESCE(a.CurrentPrice, a.StartPrice) DESC, a.AuctionUID DESC ";
        } else if (auction_types && auction_types.includes('endingSoon')) {
            sql += " ORDER BY a.EndTime ASC, a.AuctionUID DESC ";
        } else {
            // Mặc định sort theo thời gian tạo auction mới nhất (AuctionUID DESC)
            sql += " ORDER BY a.AuctionUID DESC ";
        }
    }

    // Pagination
    sql += ` LIMIT ${limit} OFFSET ${offset} `;
    
    const [rows] = await pool.execute(sql, values);
    return rows;
};

exports.countSearchAuctions = async (params) => {
    const {
        province,
        district,
        status,
        price_min,
        price_max,
        room_types,
        rating,
        auction_types
    } = params;

    let sql = `
        SELECT COUNT(*) as total FROM (
            SELECT a.AuctionUID,
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
            WHERE 1=1
    `;

    const values = [];

    // Location filter
    if (province) {
        sql += " AND p.ProvinceCode = ? ";
        values.push(province);
    }
    if (district) {
        sql += " AND p.DistrictCode = ? ";
        values.push(district);
    }

    // Status filter
    if (status) {
        sql += " AND a.Status = ? ";
        values.push(status);
    }

    // Price range filter
    if (price_min) {
        sql += " AND COALESCE(a.CurrentPrice, a.StartPrice) >= ? ";
        values.push(price_min);
    }
    if (price_max) {
        sql += " AND COALESCE(a.CurrentPrice, a.StartPrice) <= ? ";
        values.push(price_max);
    }

    // Room type filter
    if (room_types) {
        const types = room_types.split(",");
        sql += ` AND p.RoomType IN (${types.map(() => "?").join(",")}) `;
        values.push(...types);
    }

    // Auction types filter
    if (auction_types) {
        const types = auction_types.split(",");
        if (types.includes('endingSoon')) {
            sql += " AND a.EndTime <= DATE_ADD(NOW(), INTERVAL 24 HOUR) ";
        }
    }

    sql += " ) as sub ";

    // Rating filter
    if (rating) {
        sql += " WHERE sub.AverageRating >= ? ";
        values.push(rating);
    }

    const [rows] = await pool.execute(sql, values);
    return rows[0].total;
};
