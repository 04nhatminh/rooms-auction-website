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
}

module.exports = new BookingModel();
