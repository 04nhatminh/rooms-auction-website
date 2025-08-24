const db = require('../config/database');

class CalendarModel {
    // Kiểm tra tình trạng phòng trong khoảng thời gian nhất định
    // @param {string} uid - Mã định danh của sản phẩm
    // @param {Object} dateRange - { checkin, checkout }
    // @returns {Promise<Object>} - Trạng thái phòng
    
    async getRange(productId, startDate, endDate) {
        const [rows] = await db.query(
        `SELECT Day, Status, LockReason, BookingID, AuctionID, HoldExpiresAt
            FROM Calendar
            WHERE ProductID = ? AND Day >= ? AND Day < ?
            ORDER BY Day ASC`,
        [productId, startDate, endDate]
        );
        return rows;
    }

    async isRangeAvailable(productId, startDate, endDate) {
        const [rows] = await db.query(
        `SELECT Status
            FROM Calendar
            WHERE ProductID = ?
            AND Day >= ? AND Day < ?
            AND Status IN ('booked','blocked','reserved')
            LIMIT 1`,
        [productId, startDate, endDate]
        );
        if (!rows.length) return { available: true, reason: null };
        const st = rows[0].Status;
        return {
            available: false,
            reason: st === 'booked' || st === 'blocked' ? st : 'reserved',
        };
    }

    async upsertDay({
        productId, day, status = 'available',
        lockReason = null, bookingId = null, auctionId = null, holdExpiresAt = null,
    }) {
        const [res] = await db.query(
        `INSERT INTO Calendar
            (ProductID, Day, Status, LockReason, BookingID, AuctionID, HoldExpiresAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            Status = VALUES(Status),
            LockReason = VALUES(LockReason),
            BookingID = VALUES(BookingID),
            AuctionID = VALUES(AuctionID),
            HoldExpiresAt = VALUES(HoldExpiresAt)`,
        [productId, day, status, lockReason, bookingId, auctionId, holdExpiresAt]
        );
        return res.affectedRows > 0;
    }

    async setRangeStatus(productId, startDate, endDate, {
        status, lockReason = null, bookingId = null, auctionId = null, holdExpiresAt = null,
    }) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const days = [];
            for (let d = new Date(startDate); d < new Date(endDate); d.setDate(d.getDate() + 1)) {
                days.push(new Date(d).toISOString().slice(0, 10));
            }

            for (const day of days) {
                await conn.query(
                `INSERT INTO Calendar (ProductID, Day, Status, LockReason, BookingID, AuctionID, HoldExpiresAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    Status = VALUES(Status),
                    LockReason = VALUES(LockReason),
                    BookingID = VALUES(BookingID),
                    AuctionID = VALUES(AuctionID),
                    HoldExpiresAt = VALUES(HoldExpiresAt)`,
                [productId, day, status, lockReason, bookingId, auctionId, holdExpiresAt]
                );
            }

            await conn.commit();
            return true;
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

    async releaseExpiredHolds(now = new Date()) {
        const [res] = await db.query(
        `UPDATE Calendar
            SET Status = 'available',
                LockReason = NULL,
                BookingID = NULL,
                AuctionID = NULL,
                HoldExpiresAt = NULL
            WHERE Status = 'reserved'
            AND HoldExpiresAt IS NOT NULL
            AND HoldExpiresAt < ?`,
        [now]
        );
        return res.affectedRows;
    }
}

module.exports = new CalendarModel();
