// models/bookingModel.js
const db = require('../config/database');

function toDateStr(d) {
    if (!d) return null;
    const date = (d instanceof Date) ? d : new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

class BookingModel {
    static async placeDraft({ userId, productId, start, end }) {
        const conn = await db.getConnection(); // dùng cùng 1 connection cho @variables
        try {
            const startDate = toDateStr(start);
            const endDate   = toDateStr(end);
            if (!startDate || !endDate) {
                throw new Error('start/end invalid date');
            }

            // khai báo biến OUT trên session connection này
            await conn.query('SET @outBookingID = NULL, @outHoldAt = NULL');

            // gọi SP: (userId, productId, start, end, OUT bookingId, OUT holdAt)
            const callSql = `
            CALL PlaceBookingDraft(?, ?, ?, ?, @outBookingID, @outHoldAt)
            `;
            await conn.query(callSql, [userId, productId, startDate, endDate]);

            // đọc OUT values
            const [[out]] = await conn.query(`
                SELECT @outBookingID AS bookingId, @outHoldAt AS holdExpiresAt
            `);

            if (!out || !out.bookingId) {
                throw new Error('Failed to place booking draft');
            }

            return {
                bookingId: out.bookingId,
                holdExpiresAt: out.holdExpiresAt, // DATETIME (theo timezone của DB server)
            };
        } finally {
            conn.release();
        }
    }

    // async confirmPaymentSuccess({ productId, bookingId, providerTxn }) {
    //     await db.query('CALL sp_confirm_payment_success(?,?,?)', [productId, bookingId, providerTxn || null]);
    //     return { ok: true };
    // }

    // async paymentFailedOrExpired({ productId, bookingId, note }) {
    //     await db.query('CALL sp_payment_failed_or_expired(?,?,?)', [productId, bookingId, note || null]);
    //     return { ok: true };
    // }

    static async findBookingById(bookingID)
    {
        try {
            const query = `SELECT b.BookingID, b.BidID, p.UID, b.UserID, p.Name, b.UnitPrice, b.Amount, b.ServiceFee, b.StartDate, b.EndDate, b.BookingStatus
                           FROM Booking b
                           JOIN Products p ON b.ProductID = p.ProductID
                          WHERE b.BookingID = ?`;

            const [bookings] = await db.query(query, [bookingID]);
            console.log(`Fetched booking details for ${bookingID}:`, bookings);
            return bookings[0] || null;

        } catch (error) {
            console.error ('Error fetching booking details:', error)
            throw error;
        }
    }

    static async updateBookingPaid(bookingID, methodID)
    {
        try {
            const [booking] = await db.query('SELECT 1 FROM Booking WHERE BookingID=? AND BookingStatus = "pending"', [bookingID])

            if (!booking.length) {
                console.error(`Booking ${bookingID} not found or already paid`);
                throw new Error(`Booking ${bookingID} not found or already paid`);
            }
            console.log(`Updating booking paid status for ${bookingID} with methodID ${methodID}`);

            const query =   `UPDATE Booking
                        SET PaymentMethodID = ?, PaidAt = NOW(), BookingStatus = 'completed', UpdatedAt = NOW()
                        WHERE BookingID = ?`;
           
            await db.query(query, [methodID, bookingID]);

            console.log(`Updated booking paid successfully`);

        } catch (error) {
            console.error ('Error updating booking paid:', error)
            throw error;
        }
    }

    // ADMIN methods

    static async getAllBookingsForAdmin(offset = 0, limit = 10) {
        try {
            const query = `
                SELECT 
                    b.BookingID,
                    b.BidID,
                    b.UserID,
                    u.FullName as UserName,
                    u.Email as UserEmail,
                    b.ProductID,
                    p.Name as ProductName,
                    p.UID as ProductUID,
                    b.StartDate,
                    b.EndDate,
                    b.BookingStatus,
                    b.UnitPrice,
                    b.Amount,
                    b.ServiceFee,
                    b.PaymentMethodID,
                    b.PaidAt,
                    b.Source,
                    b.CreatedAt,
                    b.UpdatedAt
                FROM Booking b
                LEFT JOIN Users u ON b.UserID = u.UserID
                LEFT JOIN Products p ON b.ProductID = p.ProductID
                ORDER BY b.CreatedAt DESC
                LIMIT ? OFFSET ?
            `;
            
            const [bookings] = await db.query(query, [limit, offset]);
            return bookings;
        } catch (error) {
            console.error('Error fetching all bookings for admin:', error);
            throw error;
        }
    }

    static async getTotalBookingsCount() {
        try {
            const [result] = await db.query('SELECT COUNT(*) as total FROM Booking');
            return result[0].total;
        } catch (error) {
            console.error('Error getting total bookings count:', error);
            throw error;
        }
    }

    static async getBookingsByStatusForAdmin(status, offset = 0, limit = 10) {
        try {
            const query = `
                SELECT 
                    b.BookingID,
                    b.BidID,
                    b.UserID,
                    u.FullName as UserName,
                    u.Email as UserEmail,
                    b.ProductID,
                    p.Name as ProductName,
                    p.UID as ProductUID,
                    b.StartDate,
                    b.EndDate,
                    b.BookingStatus,
                    b.UnitPrice,
                    b.Amount,
                    b.ServiceFee,
                    b.PaymentMethodID,
                    b.PaidAt,
                    b.Source,
                    b.CreatedAt,
                    b.UpdatedAt
                FROM Booking b
                LEFT JOIN Users u ON b.UserID = u.UserID
                LEFT JOIN Products p ON b.ProductID = p.ProductID
                WHERE b.BookingStatus = ?
                ORDER BY b.CreatedAt DESC
                LIMIT ? OFFSET ?
            `;
            
            const [bookings] = await db.query(query, [status, limit, offset]);
            return bookings;
        } catch (error) {
            console.error('Error fetching bookings by status for admin:', error);
            throw error;
        }
    }

    static async getTotalBookingsCountByStatus(status) {
        try {
            const [result] = await db.query('SELECT COUNT(*) as total FROM Booking WHERE BookingStatus = ?', [status]);
            return result[0].total;
        } catch (error) {
            console.error('Error getting total bookings count by status:', error);
            throw error;
        }
    }

    static async searchBookingsByIdForAdmin(bookingId) {
        try {
            const query = `
                SELECT 
                    b.BookingID,
                    b.BidID,
                    b.UserID,
                    u.FullName as UserName,
                    u.Email as UserEmail,
                    b.ProductID,
                    p.Name as ProductName,
                    p.UID as ProductUID,
                    b.StartDate,
                    b.EndDate,
                    b.BookingStatus,
                    b.UnitPrice,
                    b.Amount,
                    b.ServiceFee,
                    b.PaymentMethodID,
                    b.PaidAt,
                    b.Source,
                    b.CreatedAt,
                    b.UpdatedAt
                FROM Booking b
                LEFT JOIN Users u ON b.UserID = u.UserID
                LEFT JOIN Products p ON b.ProductID = p.ProductID
                WHERE b.BookingID LIKE ?
                ORDER BY b.CreatedAt DESC
            `;
            
            const [bookings] = await db.query(query, [`%${bookingId}%`]);
            return bookings;
        } catch (error) {
            console.error('Error searching bookings by ID for admin:', error);
            throw error;
        }
    }

    static async getBookingDetailsForAdmin(bookingId) {
        try {
            const query = `
                SELECT 
                    b.BookingID,
                    b.BidID,
                    b.UserID,
                    pm.Provider,
                    u.FullName as UserName,
                    u.Email as UserEmail,
                    u.PhoneNumber,
                    u.DateOfBirth,
                    u.Gender,
                    p.Name as ProductName,
                    p.UID as ProductUID,
                    p.Address,
                    p.ProvinceCode,
                    p.DistrictCode,
                    pr.FullName as ProvinceName,
                    d.FullName as DistrictName,
                    rt.RoomTypeName,
                    ppt.PropertyName,
                    b.StartDate,
                    b.EndDate,
                    b.BookingStatus,
                    b.UnitPrice,
                    b.Amount,
                    b.ServiceFee,
                    b.PaidAt,
                    b.Source,
                    b.CreatedAt,
                    b.UpdatedAt
                FROM Booking b
                LEFT JOIN Users u ON b.UserID = u.UserID
                LEFT JOIN Products p ON b.ProductID = p.ProductID
                LEFT JOIN PaymentMethods pm ON b.PaymentMethodID = pm.MethodID
                LEFT JOIN Provinces pr ON p.ProvinceCode = pr.ProvinceCode
                LEFT JOIN Districts d ON p.DistrictCode = d.DistrictCode
                LEFT JOIN RoomTypes rt ON p.RoomType = rt.RoomTypeID
                LEFT JOIN Properties ppt ON p.PropertyType = ppt.PropertyID
                WHERE b.BookingID = ?
            `;
            
            const [bookings] = await db.query(query, [bookingId]);
            return bookings[0] || null;
        } catch (error) {
            console.error('Error getting booking details for admin:', error);
            throw error;
        }
    }

    static async updateBookingForAdmin(bookingId, updateData) {
        try {
            const allowedFields = ['BookingStatus', 'UnitPrice', 'Amount', 'ServiceFee', 'PaymentMethodID'];
            const updateFields = [];
            const updateValues = [];

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No valid fields to update');
            }

            updateFields.push('UpdatedAt = NOW()');
            updateValues.push(bookingId);

            const query = `UPDATE Booking SET ${updateFields.join(', ')} WHERE BookingID = ?`;
            
            const [result] = await db.query(query, updateValues);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating booking for admin:', error);
            throw error;
        }
    }
}

module.exports = BookingModel;
