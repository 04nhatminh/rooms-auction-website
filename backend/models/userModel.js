const db = require('../config/database');

class UserModel {
    // Tạo user mới với verification token
    async create(userData) {
        try {
            const { fullName, email, hashPassword, phoneNumber, AvatarURL, isVerified, rating, verificationToken, verificationTokenExpires } = userData;
            
            const query = `
                INSERT INTO Users (FullName, Email, HashPassword, PhoneNumber, AvatarURL, IsVerified, Rating, VerificationToken, VerificationTokenExpires)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                fullName,
                email,
                hashPassword || null,
                phoneNumber || null,
                AvatarURL || null,
                isVerified || false,
                rating || 0.0,
                verificationToken || null,
                verificationTokenExpires || null
            ];

            const [result] = await db.execute(query, values);
            
            // Lấy user vừa tạo để trả về (không bao gồm password và token)
            const newUser = await this.findById(result.insertId);
            const { hashPassword: _, verificationToken: __, ...userWithoutSensitiveData } = newUser;
            return userWithoutSensitiveData;
        } catch (error) {
            console.error('Error in create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Email đã tồn tại');
            }
            throw error;
        }
    }

    // Xác thực email
    async verifyUser(verificationToken) {
        try {
            const query = `
                UPDATE Users 
                SET IsVerified = TRUE, VerificationToken = NULL, VerificationTokenExpires = NULL 
                WHERE VerificationToken = ? AND VerificationTokenExpires > NOW()
            `;
            
            const [result] = await db.execute(query, [verificationToken]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in verifyUser:', error);
            throw error;
        }
    }

    // Tìm user theo điều kiện
    async findOne(criteria) {
        try {
            let query = 'SELECT * FROM Users WHERE ';
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
            if (criteria.verificationToken) {
                conditions.push('VerificationToken = ?');
                values.push(criteria.verificationToken);
            }

            if (conditions.length === 0) {
                throw new Error('Không có điều kiện tìm kiếm');
            }

            query += conditions.join(' AND ');
            
            const [rows] = await db.execute(query, values);
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
                    verificationToken: user.VerificationToken,
                    verificationTokenExpires: user.VerificationTokenExpires,
                    role: user.Role,
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

    // Lấy user theo ID
    async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM Users WHERE UserID = ?', [id]);
            if (rows.length > 0) {
                const user = rows[0];
                return {
                    id: user.UserID,
                    fullName: user.FullName,
                    email: user.Email,
                    phoneNumber: user.PhoneNumber,
                    dateOfBirth: user.DateOfBirth,
                    gender: user.Gender,
                    address: user.Address,
                    avatarURL: user.AvatarURL,
                    isVerified: user.IsVerified,
                    role: user.Role,
                    rating: user.Rating,
                    status: user.status,
                    suspendedUntil: user.SuspendedUntil,
                    unpaidStrikeCount: user.UnpaidStrikeCount,
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
                verificationToken: 'VerificationToken',
                verificationTokenExpires: 'VerificationTokenExpires',
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
            const query = `UPDATE Users SET ${fields.join(', ')}, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?`;
            
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

    // Cập nhật trạng thái user
    async updateStatus(id, status, suspendedUntil) {
        try {
            const [r] = await db.execute(
            `UPDATE Users
            SET status = ?, SuspendedUntil = ?
            WHERE UserID = ?`,
            [status, status === 'suspended' ? suspendedUntil : null, id]
            );
            return r.affectedRows;
        } catch (e) {
            console.error('Error in updateStatus:', e);
            throw e;
        }
    }

    // Xóa user
    async delete(id) {
        try {
            const [result] = await db.execute('DELETE FROM Users WHERE UserID = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    // Lấy tất cả Users
    async getAll(limit = 50, offset = 0) {
        try {
            limit = parseInt(limit);
            offset = parseInt(offset);

            console.log('Limit:', limit, 'Type:', typeof limit);
            console.log('Offset:', offset, 'Type:', typeof offset);

            const sql = `
            SELECT UserID, FullName, Email, PhoneNumber, AvatarURL, IsVerified, Role, Rating, CreatedAt, UpdatedAt 
            FROM Users 
            ORDER BY UserID ASC 
            LIMIT ${limit} OFFSET ${offset}
            `;

            const [rows] = await db.execute(sql); // KHÔNG truyền [limit, offset] nữa

            const users = rows.map(user => ({
                id: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                phoneNumber: user.PhoneNumber,
                dateOfBirth: user.DateOfBirth,
                gender: user.Gender,
                address: user.Address,
                avatarURL: user.AvatarURL,
                isVerified: user.IsVerified,
                role: user.Role,
                rating: user.Rating,
                status: user.status,
                suspendedUntil: user.SuspendedUntil,
                unpaidStrikeCount: user.UnpaidStrikeCount,
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
            const [rows] = await db.execute('SELECT COUNT(*) as total FROM Users');
            return rows[0].total;
        } catch (error) {
            console.error('Error in count:', error);
            throw error;
        }
    }
}

module.exports = new UserModel();