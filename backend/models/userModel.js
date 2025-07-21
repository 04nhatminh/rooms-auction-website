const db = require('../config/database');

class UserModel {
    // Tìm user theo điều kiện
    async findOne(criteria) {
        try {
            let query = 'SELECT * FROM users WHERE ';
            const values = [];
            const conditions = [];

            if (criteria.email) {
                conditions.push('Email = ?');
                values.push(criteria.email);
            }
            if (criteria.id) {
                conditions.push('UserID = ?');
                values.push(criteria.id);
            }

            if (conditions.length === 0) {
                throw new Error('Không có điều kiện tìm kiếm');
            }

            query += conditions.join(' AND ');
            
            const [rows] = await db.execute(query, values);
            if (rows.length > 0) {
                // Convert database column names to JavaScript camelCase
                const user = rows[0];
                return {
                    id: user.UserID,
                    fullName: user.FullName,
                    email: user.Email,
                    hashPassword: user.HashPassword,
                    phoneNumber: user.PhoneNumber,
                    avatarURL: user.AvatarURL,
                    isVerified: user.IsVerified,
                    rating: user.Rating,
                    createdAt: user.CreatedAt,
                    updatedAt: user.UpdatedAt
                };
            }
            return null;
        } catch (error) {
            console.error('Error in findOne:', error);
            throw error;
        }
    }

    // Tạo user mới
    async create(userData) {
        try {
            const { fullName, email, hashPassword, phoneNumber, AvatarURL, isVerified, rating } = userData;
            
            const query = `
                INSERT INTO users (FullName, Email, HashPassword, PhoneNumber, AvatarURL, IsVerified, Rating)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                fullName,
                email,
                hashPassword,
                phoneNumber || null,
                AvatarURL || null,
                isVerified || false,
                rating || 0.0
            ];

            const [result] = await db.execute(query, values);
            
            // Lấy user vừa tạo để trả về (không bao gồm password)
            const newUser = await this.findById(result.insertId);
            const { hashPassword: _, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('Error in create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Email đã tồn tại');
            }
            throw error;
        }
    }

    // Lấy user theo ID
    async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE UserID = ?', [id]);
            if (rows.length > 0) {
                const user = rows[0];
                return {
                    id: user.UserID,
                    fullName: user.FullName,
                    email: user.Email,
                    hashPassword: user.HashPassword,
                    phoneNumber: user.PhoneNumber,
                    avatarURL: user.AvatarURL,
                    isVerified: user.IsVerified,
                    rating: user.Rating,
                    createdAt: user.CreatedAt,
                    updatedAt: user.UpdatedAt
                };
            }
            return null;
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }

    // Cập nhật user
    async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            // Map camelCase to database column names
            const columnMap = {
                fullName: 'FullName',
                email: 'Email',
                hashPassword: 'HashPassword',
                phoneNumber: 'PhoneNumber',
                avatarURL: 'AvatarURL',
                isVerified: 'IsVerified',
                rating: 'Rating'
            };

            // Xây dựng câu query động
            Object.keys(updateData).forEach(key => {
                if (key !== 'id' && columnMap[key]) {
                    fields.push(`${columnMap[key]} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('Không có dữ liệu để cập nhật');
            }

            values.push(id);
            const query = `UPDATE users SET ${fields.join(', ')}, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?`;
            
            const [result] = await db.execute(query, values);
            
            if (result.affectedRows === 0) {
                return null;
            }

            return await this.findById(id);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    // Xóa user
    async delete(id) {
        try {
            const [result] = await db.execute('DELETE FROM users WHERE UserID = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    // Lấy tất cả users
    async getAll(limit = 50, offset = 0) {
        try {
            const [rows] = await db.execute(
                'SELECT UserID, FullName, Email, PhoneNumber, AvatarURL, IsVerified, Rating, CreatedAt, UpdatedAt FROM users ORDER BY CreatedAt DESC LIMIT ? OFFSET ?',
                [limit, offset]
            );
            
            // Convert to camelCase
            const users = rows.map(user => ({
                id: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                avatarURL: user.AvatarURL,
                isVerified: user.IsVerified,
                rating: user.Rating,
                createdAt: user.CreatedAt,
                updatedAt: user.UpdatedAt
            }));
            
            return users;
        } catch (error) {
            console.error('Error in getAll:', error);
            throw error;
        }
    }

    // Đếm tổng số users
    async count() {
        try {
            const [rows] = await db.execute('SELECT COUNT(*) as total FROM users');
            return rows[0].total;
        } catch (error) {
            console.error('Error in count:', error);
            throw error;
        }
    }
}

module.exports = new UserModel();