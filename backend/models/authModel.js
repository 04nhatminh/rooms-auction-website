const db = require('../config/database');

class AuthModel {
  /**
   * Tìm OAuth account theo provider và providerUID (Google sub)
   * @param {string} provider - Tên nhà cung cấp (ví dụ: 'google')
   * @param {string} providerUID - Mã người dùng duy nhất từ provider
   * @returns {Promise<Object|null>}
   */
  async findOAuthAccount(provider, providerUID) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM OAuthAccounts WHERE Provider = ? AND ProviderUID = ?',
        [provider, providerUID]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in findOAuthAccount:', error);
      throw error;
    }
  }

  /**
   * Tạo OAuth account mới
   * @param {Object} data - { provider, providerUID, userID }
   * @returns {Promise<void>}
   */
  async createOAuthAccount(data) {
    try {
      const { provider, providerUID, userID } = data;
      await db.execute(
        'INSERT INTO OAuthAccounts (Provider, ProviderUID, UserID) VALUES (?, ?, ?)',
        [provider, providerUID, userID]
      );
    } catch (error) {
      console.error('Error in createOAuthAccount:', error);
      throw error;
    }
  }

  /**
   * Xoá OAuth account (nếu cần dùng)
   * @param {string} provider 
   * @param {string} providerUID 
   * @returns {Promise<boolean>}
   */
  async deleteOAuthAccount(provider, providerUID) {
    try {
      const [result] = await db.execute(
        'DELETE FROM OAuthAccounts WHERE Provider = ? AND ProviderUID = ?',
        [provider, providerUID]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in deleteOAuthAccount:', error);
      throw error;
    }
  }

  /**
   * Tìm tất cả OAuth accounts của một người dùng
   * @param {number} userID 
   * @returns {Promise<Array>}
   */
  async findAllByUserID(userID) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM OAuthAccounts WHERE UserID = ?',
        [userID]
      );
      return rows;
    } catch (error) {
      console.error('Error in findAllByUserID:', error);
      throw error;
    }
  }
}

module.exports = new AuthModel();
