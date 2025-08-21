const pool = require('../config/database');

exports.searchRooms = async (params) => {
  const {
    province,
    district,
    guests,
    sort,
    price_min,
    price_max,
    property_types,
    rating,
    limit,
    offset,
  } = params;

  let sql = `
    SELECT 
      p.*, 
      ( (COALESCE(p.CleanlinessPoint,0) + COALESCE(p.LocationPoint,0) + 
          COALESCE(p.ServicePoint,0) + COALESCE(p.ValuePoint,0) + 
          COALESCE(p.CommunicationPoint,0) + COALESCE(p.ConveniencePoint,0)
        ) / 6 ) AS avgRating
    FROM Products p
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

  // Rating filter
  if (rating) {
    sql += " HAVING avgRating >= ? ";
    values.push(rating);
  }

  // Sort
  if (sort === "price_asc") {
    sql += " ORDER BY p.Price ASC ";
  } else if (sort === "price_desc") {
    sql += " ORDER BY p.Price DESC ";
  } else {
    sql += " ORDER BY p.LastSyncedAt DESC "; // giả sử "popular" = cập nhật gần nhất
  }

  // Pagination
  sql += " LIMIT ? OFFSET ? ";
  values.push(Number(limit), Number(offset));

  const [rows] = await pool.execute(sql, values);
  return rows;
};
