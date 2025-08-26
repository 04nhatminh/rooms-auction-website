const db = require('../config/database');

class CalendarModel {
    // Kiểm tra tình trạng phòng trong khoảng thời gian nhất định
    // @param {string} uid - Mã định danh của sản phẩm
    // @param {Object} dateRange - { checkin, checkout }
    // @returns {Promise<Object>} - Trạng thái phòng
    
    async getRange(productId, startDate, endDate) {
        const [rows] = await db.query(
        `SELECT
            c.Day, c.Status, c.LockReason, c.BookingID, c.AuctionID,
            a.AuctionUID AS AuctionUID
        FROM Calendar c
        LEFT JOIN Auction a ON a.AuctionID = c.AuctionID
        WHERE c.ProductID = ?
        AND c.Day >= ? AND c.Day < ?
        ORDER BY c.Day ASC`,
        [productId, startDate, endDate]
        );
        return rows;
    }

    async isRangeAvailable(productId, startDate, endDate) {
        const [rows] = await db.query(`
            SELECT
            c.Day                AS Day,
            c.Status             AS Status,
            c.LockReason         AS LockReason,
            c.BookingID          AS BookingID,
            c.AuctionID          AS AuctionID,
            a.AuctionUID         AS AuctionUID,
            a.EndTime            AS AuctionEndTime,
            (a.BidIncrement+0)   AS AuctionBidIncrement
            FROM Calendar c
            LEFT JOIN Auction a ON a.AuctionID = c.AuctionID
            WHERE c.ProductID = ?
            AND c.Day >= ? AND c.Day < ?
            AND c.Status IN ('booked','blocked','reserved')
            ORDER BY c.Day ASC
        `, [productId, startDate, endDate]);

        if (!rows.length) {
            return { available: true, reason: null, hasAuction: false, days: [] };
        }

        const blockedByAuction = rows.some(r => r.LockReason === 'auction' && r.AuctionID);

        // reason tổng quát
        let reason = 'reserved';
        if (rows.some(r => r.Status === 'booked')) reason = 'booked';
        else if (rows.some(r => r.Status === 'blocked' && r.LockReason !== 'auction')) reason = 'blocked';
        else if (blockedByAuction) reason = 'blocked';

        // gom thông tin phiên (nếu có)
        let auction = undefined;
        if (blockedByAuction) {
            // chọn 1 dòng đại diện (nếu nhiều ngày cùng 1 phiên)
            const r = rows.find(x => x.LockReason === 'auction' && x.AuctionID);
            auction = {
            auctionId:        r.AuctionID,
            auctionUid:       String(r.AuctionUID || ''),     // <-- TRẢ UID
            endTime:          r.AuctionEndTime || null,
            bidIncrement:     r.AuctionBidIncrement ?? null,
            };
        }

        const days = rows.map(r => ({
            day: r.Day,
            status: r.Status,
            lockReason: r.LockReason,
            bookingId: r.BookingID,
            auctionId: r.AuctionID,
            auctionUid: r.AuctionUID || null,    // <-- TRẢ UID THEO NGÀY
        }));

        return {
            available: false,
            reason,
            hasAuction: !!blockedByAuction,
            auction,
            days,
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
