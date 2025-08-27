// models/bookingModel.js
const db = require('../config/database');
const pool = require('../config/database');

function toDateStr(d) {
    if (!d) return null;
    const date = (d instanceof Date) ? d : new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

class BookingModel {
    static async placeDraft({ userId, productId, start, end }) {
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

    static async updateBookingCancelled(bookingID)
    {
        try {
            const [booking] = await db.query('SELECT 1 FROM Booking WHERE BookingID=? AND BookingStatus = "pending"', [bookingID])

            if (!booking.length) {
                console.error(`Booking ${bookingID} not found or already paid`);
                throw new Error(`Booking ${bookingID} not found or already paid`);
            }
            console.log(`Updating booking paid status for ${bookingID}`);

            const query =   `UPDATE Booking
                            SET  BookingStatus = 'cancelled', UpdatedAt = NOW()
                            WHERE BookingID = ?;

                            UPDATE Calendar c
                            JOIN Booking b ON b.BookingID = c.BookingID
                            SET
                                c.Status = 'available',
                                c.LockReason = NULL,
                                c.HoldExpiresAt = NULL,
                                c.BookingID = NULL,
                                c.AuctionID = NULL,
                                c.UpdatedAt = NOW()
                            WHERE b.BookingStatus IN ('cancelled', 'expired')
                                AND c.Status IN ('booked','reserved')
                                AND b.BookingID = ?;`;
           
            await db.query(query, [bookingID, bookingID]);

            console.log(`Updated booking cancelled successfully`);

        } catch (error) {
            console.error ('Error cancelling booking paid:', error)
            throw error;
        }
    }

    static async getUserTransactionHistory(userId) {
        const [rows] = await pool.execute(`
            SELECT 
                pay.PaymentID,
                pay.BookingID,
                pay.Amount,
                pay.Currency,
                pay.Provider,
                pay.ProviderTxnID,
                pay.Status,
                pay.FailureReason,
                pay.CreatedAt,
                pay.UpdatedAt,
                bk.StartDate,
                bk.EndDate,
                bk.BookingStatus,
                p.Name as room,
                p.UID as roomUID,
                prov.Name as provinceName
            FROM Payments pay
            JOIN Booking bk ON pay.BookingID = bk.BookingID
            JOIN Products p ON bk.ProductID = p.ProductID
            LEFT JOIN Provinces prov ON p.ProvinceCode = prov.ProvinceCode
            WHERE pay.UserID = ?
            ORDER BY pay.CreatedAt DESC
        `, [userId]);
        return rows.map(row => ({
            paymentId: row.PaymentID,
            bookingId: row.BookingID,
            room: row.room,
            roomUID: row.roomUID,
            province: row.provinceName,
            amount: row.Amount,
            currency: row.Currency,
            provider: row.Provider,
            providerTxnId: row.ProviderTxnID,
            status: row.Status,
            failureReason: row.FailureReason,
            createdAt: toDateStr(row.CreatedAt),
            updatedAt: toDateStr(row.UpdatedAt),
            bookingStatus: row.BookingStatus,
            startDate: toDateStr(row.StartDate),
            endDate: toDateStr(row.EndDate),
        }));
    }
}

module.exports = BookingModel;
