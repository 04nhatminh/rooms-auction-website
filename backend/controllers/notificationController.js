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

  static async markAsRead(req, res) {
    const userId = req.user.id;
    const notificationId = req.params.id;
    await pool.query(
      `UPDATE Notifications SET IsRead = 1 WHERE NotificationID = ? AND UserID = ?`,
      [notificationId, userId]
    );
    res.json({ success: true });
  }
}

module.exports = NotificationController;