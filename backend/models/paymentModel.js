const pool = require('../config/database');

class PaymentModel {
  /**
   * Create an initiated payment row (no ProviderTxnID yet).
   * Returns only a success flag; never leaks PaymentID.
   */
  static async insertInitiated(bookingID, userID, amount, currency, provider) {
    try {
      await pool.query(
        `INSERT INTO Payments
           (BookingID, UserID, Amount, Currency, Provider, ProviderTxnID, Status)
         VALUES (?, ?, ?, ?, ?, NULL, 'initiated')`,
        [bookingID, userID, amount, currency, provider]
      );
      return { success: true };
    } catch (error) {
      console.error('Error inserting initiated payment:', error);
      throw error;
    }
  }

  /**
   * Mark the latest pending payment (initiated/authorized) for a booking as captured.
   * Safely picks the most recent row and never returns PaymentID.
   * Overwrites Amount/Currency from PayPal if provided.
   */
  static async updateCapturedByBooking(bookingID,  captureId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Find most recent payment that is not finalized yet
      const [rows] = await conn.query(
        `SELECT PaymentID
           FROM Payments
          WHERE BookingID = ?
            AND Status IN ('initiated','authorized')
          ORDER BY CreatedAt DESC
          LIMIT 1`,
        [bookingID]
      );

      if (rows.length === 0) {
        await conn.rollback();
        return { success: false, message: 'No pending payment found for booking' };
      }

      const paymentID = rows[0].PaymentID

      await conn.query(
        `UPDATE Payments 
        SET Status = 'captured', ProviderTxnID = ?, UpdatedAt = NOW() 
        WHERE PaymentID = ?`,
        [captureId, paymentID]
      );

      await conn.commit();
      return { success: true };
    } catch (error) {
      await conn.rollback();
      // Unique key (Provider, ProviderTxnID) guard (idempotency)
      if (error && error.code === 'ER_DUP_ENTRY') {
        return { success: false, duplicate: true, message: 'Duplicate captureId for provider' };
      }
      console.error('Error marking captured payment:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Mark failure with a reason.
   */
  static async updateFailedLatestByBooking(bookingID, reason = null) {
    try {
      const [payments] = await pool.query(
        `SELECT PaymentID
           FROM Payments
          WHERE BookingID = ?
            AND Status IN ('initiated','authorized')
          ORDER BY CreatedAt DESC
          LIMIT 1`,
        [bookingID]
      );
      if (payments.length === 0) return { success: false, message: 'No pending payment found' };

      await pool.query(
        `UPDATE Payments
            SET Status = 'failed',
                FailureReason = ?,
                UpdatedAt = NOW()
          WHERE PaymentID = ?`,
        [reason, payments[0].PaymentID]
      );
      return { success: true };
    } catch (error) {
      console.error('Error marking failed payment:', error);
      throw error;
    }
  }
}

module.exports = PaymentModel;
