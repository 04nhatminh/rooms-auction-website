// models/bookingModel.js
const db = require('../config/database');

class BookingModel {
    async placeDraft({ userId, productId, start, end, nights, unitPrice, currency, provider, holdMinutes = 30 }) {
        const conn = await db.getConnection();   // dùng cùng 1 connection cho @variables
        try {
        // 1) khai báo biến OUT
        await conn.query('SET @outBookingID = NULL, @outPaymentID = NULL, @outHoldAt = NULL');

        // 2) gọi SP, truyền @variables vào vị trí OUT
        const sql = `
            CALL sp_place_booking_draft(?, ?, ?, ?, ?, ?, ?, ?, ?, @outBookingID, @outPaymentID, @outHoldAt)
        `;
        await conn.query(sql, [userId, productId, start, end, nights, unitPrice, currency, provider, holdMinutes]);

        // 3) lấy OUT values
        const [[out]] = await conn.query(
            'SELECT @outBookingID AS bookingId, @outPaymentID AS paymentId, @outHoldAt AS holdExpiresAt'
        );

        if (!out || !out.bookingId) throw new Error('Failed to place booking draft');
        return out;
        } finally {
        conn.release();
        }
    }

    async confirmPaymentSuccess({ productId, bookingId, providerTxn }) {
        await db.query('CALL sp_confirm_payment_success(?,?,?)', [productId, bookingId, providerTxn || null]);
        return { ok: true };
    }

    async paymentFailedOrExpired({ productId, bookingId, note }) {
        await db.query('CALL sp_payment_failed_or_expired(?,?,?)', [productId, bookingId, note || null]);
        return { ok: true };
    }

    async findBookingById(bookingID)
    {
        try {
            const query = `SELECT b.BookingID, b.BidID, b.UserID, p.Name, b.WinningPrice, b.StartDate, b.EndDate, b.BookingStatus
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

    async updateBookingPaid(bookingID, methodID)
    {
        try {
            const [booking] = await db.query('SELECT 1 FROM Booking WHERE BookingID=? AND BookingStatus = "pending"', [bookingID])

            if (!booking.length) {
                console.error(`Booking ${bookingID} not found or already paid`);
                throw new Error(`Booking ${bookingID} not found or already paid`);
            }
            console.log(`Updating booking paid status for ${bookingID} with methodID ${methodID}`);

            const query =   `UPDATE Booking
                        SET PaymentMethodID = ?, PaidAt = NOW(), BookingStatus = 'confirmed', UpdatedAt = NOW()
                        WHERE BookingID = ?`;
           
            await db.query(query, [methodID, bookingID]);

            console.log(`Updated booking paid successfully`);

        } catch (error) {
            console.error ('Error updating booking paid:', error)
            throw error;
        }
    }
}

module.exports = BookingModel;
