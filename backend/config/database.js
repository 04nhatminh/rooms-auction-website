const mysql = require('mysql2/promise');

// Cấu hình kết nối database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'NNMsql123!@#', 
    database: process.env.DB_NAME || 'ec_web_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Tạo connection pool
const pool = mysql.createPool(dbConfig);

// Test kết nối
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        connection.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
    }
}

// Khởi tạo database khi import
async function initDatabase() {
    await testConnection();
}

initDatabase();

module.exports = pool;