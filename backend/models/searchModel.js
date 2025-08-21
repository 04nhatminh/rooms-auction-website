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
        property_types,
        rating,
        limit,
        offset,
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
                prop.PropertyName,
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
                    ) / 6, 2) AS avgRating
        FROM Products p
        LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
        LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
        LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
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

    // Property type filter
    if (property_types) {
        const types = property_types.split(","); // ví dụ "1,2,3"
        sql += ` AND p.PropertyType IN (${types.map(() => "?").join(",")}) `;
        values.push(...types);
    }

    // Sort and popular, but handle HAVING clause properly
    let orderByClause = "";
    let havingClause = "";

    // Rating filter
    if (rating) {
        havingClause = " HAVING avgRating >= ? ";
        values.push(rating);
    }

    // Sort clause
    if (popular) {
        if (sort === "price_asc") {
            orderByClause = " ORDER BY p.Price ASC, avgRating DESC ";
        } else if (sort === "price_desc") {
            orderByClause = " ORDER BY p.Price DESC, avgRating DESC ";
        } else {
            orderByClause = " ORDER BY avgRating DESC, p.Price ASC ";
        }
    } else {
        if (sort === "price_asc") {
            orderByClause = " ORDER BY p.Price ASC ";
        } else if (sort === "price_desc") {
            orderByClause = " ORDER BY p.Price DESC ";
        } else {
            orderByClause = " ORDER BY p.ProductID DESC "; // Default sort
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
        popular,
        sort,
        price_min,
        price_max,
        property_types,
        rating,
    } = params;

    let sql = `
        SELECT COUNT(*) as total
        FROM Products p
        LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
        LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
        LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
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

    // Property type filter
    if (property_types) {
        const types = property_types.split(",");
        sql += ` AND p.PropertyType IN (${types.map(() => "?").join(",")}) `;
        values.push(...types);
    }

    // Rating filter - cần subquery cho count với HAVING
    if (rating) {
        sql = `
            SELECT COUNT(*) as total FROM (
                SELECT p.ProductID,
                        ROUND((
                            COALESCE(p.CleanlinessPoint, 0) + 
                            COALESCE(p.LocationPoint, 0) + 
                            COALESCE(p.ServicePoint, 0) + 
                            COALESCE(p.ValuePoint, 0) + 
                            COALESCE(p.CommunicationPoint, 0) + 
                            COALESCE(p.ConveniencePoint, 0)
                        ) / 6, 2) AS avgRating
                FROM Products p
                LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
                LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
                LEFT JOIN Properties prop ON p.PropertyType = prop.PropertyID
                WHERE 1=1
        `;
        
        // Thêm lại các filters
        if (province) {
            sql += " AND p.ProvinceCode = ? ";
        }
        if (district) {
            sql += " AND p.DistrictCode = ? ";
        }
        if (guests) {
            sql += " AND p.MaxGuests >= ? ";
        }
        if (price_min) {
            sql += " AND p.Price >= ? ";
        }
        if (price_max) {
            sql += " AND p.Price <= ? ";
        }
        if (property_types) {
            const types = property_types.split(",");
            sql += ` AND p.PropertyType IN (${types.map(() => "?").join(",")}) `;
        }
        
        sql += " HAVING avgRating >= ? ) as filtered_results";
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
        auction_types,
        limit,
        offset,
    } = params;

    let sql = `
        SELECT a.AuctionUID,
                a.ProductID,
                a.StartPrice,
                a.CurrentPrice,
                a.StayPeriodStart,
                a.StayPeriodEnd,
                a.StartTime,
                a.EndTime,
                a.Status,
                p.Name as ProductName,
                p.Address,
                p.ProvinceCode,
                p.DistrictCode,
                prov.Name AS ProvinceName,
                dist.Name AS DistrictName
        FROM Auction a
        JOIN Products p ON a.ProductID = p.ProductID
        LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
        LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
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
    if (sort === "price_asc") {
        sql += " ORDER BY COALESCE(a.CurrentPrice, a.StartPrice) ASC ";
    } else if (sort === "price_desc") {
        sql += " ORDER BY COALESCE(a.CurrentPrice, a.StartPrice) DESC ";
    } else if (auction_types && auction_types.includes('endingSoon')) {
        sql += " ORDER BY a.EndTime ASC ";
    } else {
        sql += " ORDER BY a.StartTime DESC "; // Default: newest first
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
        sort,
        price_min,
        price_max,
        auction_types,
    } = params;

    let sql = `
        SELECT COUNT(*) as total
        FROM Auction a
        JOIN Products p ON a.ProductID = p.ProductID
        LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
        LEFT JOIN Districts dist ON p.DistrictCode = dist.DistrictCode
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

    // Auction types filter
    if (auction_types) {
        const types = auction_types.split(",");
        
        if (types.includes('endingSoon')) {
            sql += " AND a.EndTime <= DATE_ADD(NOW(), INTERVAL 24 HOUR) ";
        }
    }
    
    const [rows] = await pool.execute(sql, values);
    return rows[0].total;
};
