const pool = require('../config/database');

exports.searchRooms = async (params) => {
    const {
        province,
        district,
        guests,
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

    // Sort clause - gộp popular và sort thành một
    if (sort === "popular") {
        // Phổ biến nhất: sort theo rating cao nhất
        orderByClause = " ORDER BY AverageRating DESC, p.ProductID ASC ";
    } else if (sort === "newest") {
        // Mới nhất: sort theo ProductID giảm dần (mới nhất trước)
        orderByClause = " ORDER BY p.ProductID DESC ";
    } else if (sort === "price_asc") {
        // Giá tăng dần
        orderByClause = " ORDER BY p.Price ASC, p.ProductID ASC ";
    } else if (sort === "price_desc") {
        // Giá giảm dần
        orderByClause = " ORDER BY p.Price DESC, p.ProductID ASC ";
    } else {
        // Mặc định: mới nhất
        orderByClause = " ORDER BY p.ProductID DESC ";
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
        limit,
        offset
    } = params;

    let sql = `
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
        sql += " AND a.CurrentPrice >= ? ";
        values.push(price_min);
    }
    if (price_max) {
        sql += " AND a.CurrentPrice <= ? ";
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

    // Sort logic based on auction_types (sort only, not filter)
    let orderClause = "";
    
    if (auction_types) {
        if (auction_types === 'endingSoon') {
            // Sắp kết thúc: sort theo EndTime ASC (sắp kết thúc trước)
            orderClause = " ORDER BY a.EndTime ASC";
        } else if (auction_types === 'featured') {
            // Nổi bật nhất: sort theo số lượt bid DESC (bid nhiều nhất trước)
            orderClause = " ORDER BY BidCount DESC";
        } else if (auction_types === 'newest') {
            // Mới nhất: sort theo thời gian tạo mới nhất (StartTime DESC)
            orderClause = " ORDER BY a.StartTime DESC ";
        }
    }

    // Default sorting if no auction_types specified
    if (!orderClause) {
        if (sort === "popular") {
            // Phổ biến nhất: sort theo rating cao nhất
            orderClause = " ORDER BY AverageRating DESC ";
        } else if (sort === "newest") {
            // Mới nhất: sort theo thời gian tạo mới nhất (StartTime DESC)
            orderClause = " ORDER BY a.StartTime DESC ";
        } else if (sort === "price_asc") {
            // Giá tăng dần
            orderClause = " ORDER BY a.CurrentPrice ASC ";
        } else if (sort === "price_desc") {
            // Giá giảm dần
            orderClause = " ORDER BY a.CurrentPrice DESC";
        } else {
            // Mặc định: popular
            orderClause = " ORDER BY AverageRating DESC ";
        }
    }

    sql += orderClause;

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
        rating
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
        sql += " AND a.CurrentPrice >= ? ";
        values.push(price_min);
    }
    if (price_max) {
        sql += " AND a.CurrentPrice <= ? ";
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
