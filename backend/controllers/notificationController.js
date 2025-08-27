const pool = require('../config/database');

class NotificationController {
  static async getUserNotifications(req, res) {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT NotificationID, AuctionID, Type, Message, IsRead, CreatedAt
       FROM Notifications WHERE UserID = ? ORDER BY CreatedAt DESC`, [userId]
    );
    res.json({ success: true, items: rows });
  }
}

module.exports = NotificationController;