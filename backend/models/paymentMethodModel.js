const pool = require('../config/database');
class PaymentMethodModel {

    /**
     * Lưu phương thức PayPal CHỈ ĐỂ HIỂN THỊ:
     * - Provider='PayPal'
     * - AccountIdentifier = email rút gọn
     * - Token = payerId (chỉ nhận diện)
     * Trả về methodId (tạo mới nếu chưa có; nếu đã có thì trả lại cái cũ).
     */
    static async upsertDisplayPaypalMethod(userId, payerId, payerEmail)
    {
        try {
            const provider = 'PayPal';
            const identifier = obfuscateEmail(payerEmail);
            const token = payerId || 'unknown';

            // Thử tìm method trùng user + provider + token
            const [exist] = await pool.query(
                `SELECT MethodID FROM PaymentMethods WHERE UserID=? AND Provider=? AND Token=? LIMIT 1`,
                [userId, provider, token]
            );
            if (exist.length) return exist[0].MethodID;

            // Nếu bảng MethodID không AUTO_INCREMENT, tạo MethodID thủ công
            const [maxRow] = await pool.query(`SELECT COALESCE(MAX(MethodID),0)+1 AS nextId FROM PaymentMethods`);
            const nextId = maxRow[0]?.nextId || 1;

            await pool.query(
                `INSERT INTO PaymentMethods (MethodID, AccountIdentifier, Token, Provider, IsDefault, UserID, CreatedAt)
                VALUES (?, ?, ?, ?, 0, ?, NOW());`,
                [nextId, identifier, token, provider, userId]
            );
            console.log(`Upserted successfully for payment method ${nextId}`);
            return nextId;

        } catch (error) {
            console.error ('Error fetching product details:', error)
            throw error;
        }
    }

    /**
   * Lưu phương thức PayPal dùng cho sạc S2S:
   * - Provider='PayPal'
   * - Token = vaultCustomerId (từ capture)
   * - AccountIdentifier = email rút gọn (để hiển thị)
   * Trả về MethodID.
   */
  static async upsertPaypalVaultCustomer(userId, vaultCustomerId, payerEmail = null) {
    try {
    const provider = 'PayPal';
    const token = vaultCustomerId;
    const identifier = obfuscateEmail(payerEmail);

    // Tìm method trùng (UserID, Provider, Token)
    const [exist] = await pool.query(
        `SELECT MethodID FROM PaymentMethods
        WHERE UserID=? AND Provider=? AND Token=? LIMIT 1`,
        [userId, provider, token]
    );
    if (exist.length) return exist[0].MethodID;

    // Nếu bảng chưa AUTO_INCREMENT, tạo thủ công như bạn đang làm
    const [maxRow] = await pool.query(
        `SELECT COALESCE(MAX(MethodID),0)+1 AS nextId FROM PaymentMethods`
    );
    const nextId = maxRow[0]?.nextId || 1;

    await pool.query(
        `INSERT INTO PaymentMethods
        (MethodID, AccountIdentifier, Token, Provider, IsDefault, UserID, CreatedAt)
        VALUES (?, ?, ?, ?, 0, ?, NOW());`,
        [nextId, identifier, token, provider, userId]
    );

    console.log(`Upserted PayPal VAULT for user ${userId} -> method ${nextId}`);
    return nextId;
    } catch (err) {
        console.error('Error upserting PayPal VAULT method:', err);
        throw err;
        }
    }

    static async upsertZaloPayMethod(userId, accountIdentifier = 'zalopay') {
        try {
            const provider = 'ZALOPAY';
            const token = 'ZALOPAY'; // ZP chưa có "vault token" tái sử dụng; ta dùng hằng để nhận diện

            // Tìm method trùng (UserID, Provider, Token)
            const [exist] = await pool.query(
            `SELECT MethodID FROM PaymentMethods
            WHERE UserID=? AND Provider=? AND Token=? LIMIT 1`,
            [userId, provider, token]
            );
            if (exist.length) return exist[0].MethodID;

            // Tạo MethodID thủ công như các hàm PayPal của bạn
            const [maxRow] = await pool.query(
            `SELECT COALESCE(MAX(MethodID),0)+1 AS nextId FROM PaymentMethods`
            );
            const nextId = maxRow[0]?.nextId || 1;

            await pool.query(
            `INSERT INTO PaymentMethods
            (MethodID, AccountIdentifier, Token, Provider, IsDefault, UserID, CreatedAt)
            VALUES (?, ?, ?, ?, 0, ?, NOW());`,
            [nextId, accountIdentifier, token, provider, userId]
            );

            return nextId;
        } catch (err) {
            console.error('Error upserting ZaloPay method:', err);
            throw err;
        }
    }
};

// Ẩn bớt email: "john.doe@example.com" -> "jo**@example.com"
function obfuscateEmail(email) {
  if (!email || !email.includes('@')) return 'ppal';
  const [u, d] = email.split('@');
  if (u.length <= 2) return `${u[0] || '*'}*@${d}`;
  return `${u.slice(0,2)}**@${d}`;
}

module.exports = PaymentMethodModel;