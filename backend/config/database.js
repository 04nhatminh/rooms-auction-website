const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

// Cấu hình kết nối database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3308,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'a2airbnb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('🔍 Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password ? '***hidden***' : 'empty',
    database: dbConfig.database
});

console.log('✅ Loaded .env DB_PASSWORD =', JSON.stringify(process.env.DB_PASSWORD));

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

// Tạo bảng users với verification fields
async function createUsersTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            UserID INT AUTO_INCREMENT PRIMARY KEY,
            FullName VARCHAR(255) NOT NULL,
            Email VARCHAR(255) UNIQUE NOT NULL,
            HashPassword VARCHAR(255) NOT NULL,
            PhoneNumber VARCHAR(20),
            AvatarURL TEXT,
            IsVerified BOOLEAN DEFAULT FALSE,
            VerificationToken VARCHAR(255),
            VerificationTokenExpires DATETIME,
            Rating DECIMAL(2,1) DEFAULT 0.0,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    try {
        await pool.execute(createTableQuery);
        console.log('✅ Bảng users đã sẵn sàng');
    } catch (error) {
        console.error('❌ Lỗi tạo bảng users:', error.message);
    }
}

// Khởi tạo database khi import
async function initDatabase() {
    await testConnection();
    await createUsersTable();
}

initDatabase();

module.exports = pool;