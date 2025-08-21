const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

class UserController {
    // Đăng ký người dùng mới với email verification
    async register(req, res) {
        try {
            const { fullName, email, password, phoneNumber, AvatarURL, rating } = req.body;

            // Validation
            if (!fullName || !email || !password) {
                return res.status(400).json({ 
                    message: 'Vui lòng cung cấp đầy đủ thông tin: họ tên, email và mật khẩu.' 
                });
            }

            // Kiểm tra email đã tồn tại chưa
            const existingUser = await userModel.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email đã tồn tại.' });
            }

            // Hash password
            const hashPassword = await bcrypt.hash(password, 10);

            // Tạo verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

            // Tạo user mới
            const newUser = await userModel.create({
                fullName,
                email,
                hashPassword,
                phoneNumber,
                AvatarURL,
                isVerified: false,
                rating,
                verificationToken,
                verificationTokenExpires
            });

            // Gửi email xác thực
            try {
                await emailService.sendVerificationEmail(email, fullName, verificationToken);
                console.log(`✅ Verification email sent to: ${email}`);
            } catch (emailError) {
                console.error('❌ Failed to send verification email:', emailError);
                // Không return lỗi ở đây, vì user đã được tạo thành công
            }

            return res.status(201).json({ 
                message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
                user: newUser,
                needsVerification: true
            });
        } catch (error) {
            console.error('Error in register:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    // Xác thực email
    async verifyEmail(req, res) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.status(400).json({ message: 'Token xác thực không hợp lệ.' });
            }

            // Tìm user với token và kiểm tra thời hạn
            const user = await userModel.findOne({ verificationToken: token });
            
            if (!user) {
                return res.status(400).json({ 
                    message: 'Token xác thực không hợp lệ hoặc đã hết hạn.' 
                });
            }

            // Kiểm tra token có hết hạn không
            if (new Date() > new Date(user.verificationTokenExpires)) {
                return res.status(400).json({ 
                    message: 'Token xác thực đã hết hạn.' 
                });
            }

            // Xác thực user
            const verified = await userModel.verifyUser(token);
            
            if (verified) {
                // Redirect về frontend SPA route
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
                return res.redirect(`${frontendUrl}/verification-success`);
            } else {
                return res.status(400).json({ 
                    message: 'Xác thực thất bại.' 
                });
            }
        } catch (error) {
            console.error('Error in verifyEmail:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    // Gửi lại email xác thực
    async resendVerification(req, res) {
        try {
            const { email } = req.body;

            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'Email không tồn tại.' });
            }

            if (user.isVerified) {
                return res.status(400).json({ message: 'Tài khoản đã được xác thực.' });
            }

            // Tạo token mới
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Cập nhật token mới
            await userModel.update(user.id, {
                verificationToken,
                verificationTokenExpires
            });

            // Gửi email
            await emailService.sendVerificationEmail(email, user.fullName, verificationToken);

            return res.status(200).json({ 
                message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.' 
            });
        } catch (error) {
            console.error('Error in resendVerification:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    // Đăng nhập (chỉ cho phép user đã xác thực)
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await userModel.findOne({ email });
            if (!user) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });

            if (!user.isVerified) {
            return res.status(400).json({
                message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.',
                needsVerification: true,
                email
            });
            }

            const isMatch = await bcrypt.compare(password, user.hashPassword);
            if (!isMatch) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });

            const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'guest' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
            );

            // Set cookie HttpOnly
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('bidstay_token', token, {
            httpOnly: true,
            secure: isProd,                 // production: true (HTTPS)
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,    // 1 ngày
            path: '/',
            });

            // Trả thông tin user (không trả token nữa)
            const { hashPassword, verificationToken, verificationTokenExpires, ...safeUser } = user;
            return res.status(200).json({
            message: 'Đăng nhập thành công.',
            user: safeUser
            });
        } catch (error) {
            console.error('Error in login:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    async logout(req, res) {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('bidstay_token', { path: '/', sameSite: isProd ? 'none' : 'lax', secure: isProd });
        return res.json({ ok: true });
    }


    // Lấy thông tin user theo ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await userModel.findById(id);
            if (!user) return res.status(404).json({ message: 'User không tồn tại' });
            return res.json(user);
        } catch (err) {
            console.error('getUserById error:', err);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Lấy danh sách tất cả user (admin)
    async getAllUsers(req, res) {
        try {
            // Đọc page & limit từ query string
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            // Gọi model
            const users = await userModel.getAll(limit, offset);

            // Trả kết quả
            res.json(users);
        } catch (err) {
            console.error("Error in getAllUsers:", err);
            res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
        }
    }

    async deleteUser(req, res) {
        try {
            const userId = req.params.id;

            // Kiểm tra xem user có tồn tại không
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Người dùng không tồn tại.' });
            }

            if (user.role === 'admin') {
                return res.status(400).json({ message: 'Không thể xóa tài khoản admin' });
            }

            // Xóa user
            await userModel.delete(userId);

            return res.status(200).json({ message: 'Người dùng đã được xóa thành công.' });
        } catch (error) {
            console.error('Error in deleteUser:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, suspendedUntil } = req.body;

            const user = await userModel.findById(id);
            if (!user) return res.status(404).json({ message: 'User không tồn tại' });

            // Không cho update status của admin
            if (user.role === 'admin') {
                return res.status(400).json({ message: 'Không thể thay đổi trạng thái admin' });
            }

            // Validate status
            if (!['active','disabled','suspended'].includes(status)) {
                return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
            }

            // Xử lý suspendedUntil theo status
            let until = null;
            if (status === 'suspended') {
                if (!suspendedUntil) {
                return res.status(400).json({ message: 'Cần nhập thời điểm kết thúc tạm treo' });
                }
                until = new Date(suspendedUntil);
                if (Number.isNaN(+until)) {
                return res.status(400).json({ message: 'Thời gian không hợp lệ' });
                }
            }

            // Cập nhật
            const affected = await userModel.updateStatus(id, status, until);
            if (!affected) return res.status(500).json({ message: 'Cập nhật thất bại' });

            const updated = await userModel.findById(id);
            return res.json(updated);
        } catch (e) {
            console.error('updateUserStatus error:', e);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    }

    // Lấy hồ sơ người dùng hiện tại
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await userModel.findById(userId);
            if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            const { hashPassword, verificationToken, verificationTokenExpires, ...safeUser } = user;
            return res.json({ success: true, user: safeUser });
        } catch (error) {
            console.error('Error in getProfile:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    // Cập nhật hồ sơ (không cho đổi email ở đây)
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { fullName, phoneNumber, avatarURL, dateOfBirth, gender, address } = req.body;

            const payload = {};
            if (fullName !== undefined) payload.fullName = fullName;
            if (phoneNumber !== undefined) payload.phoneNumber = phoneNumber;
            if (avatarURL !== undefined) payload.avatarURL = avatarURL;
            if (dateOfBirth !== undefined) payload.DateOfBirth = dateOfBirth; // handled in model with column map? add support below
            if (gender !== undefined) payload.Gender = gender;
            if (address !== undefined) payload.Address = address;

            // Normalize to model expected keys
            const normalized = {
                ...('fullName' in payload ? { fullName: payload.fullName } : {}),
                ...('phoneNumber' in payload ? { phoneNumber: payload.phoneNumber } : {}),
                ...('avatarURL' in payload ? { avatarURL: payload.avatarURL } : {}),
            };

            // Custom columns not in model map yet -> run raw updates
            const updated = await userModel.update(userId, normalized);

            // Directly update optional fields if provided
            const db = require('../config/database');
            const extraFields = [];
            const values = [];
            if (dateOfBirth !== undefined) { extraFields.push('DateOfBirth = ?'); values.push(dateOfBirth || null); }
            if (gender !== undefined) { extraFields.push('Gender = ?'); values.push(gender || null); }
            if (address !== undefined) { extraFields.push('Address = ?'); values.push(address || null); }
            if (extraFields.length) {
                values.push(userId);
                await db.execute(`UPDATE Users SET ${extraFields.join(', ')}, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?`, values);
            }

            const user = await userModel.findById(userId);
            const { hashPassword, verificationToken, verificationTokenExpires, ...safeUser } = user;
            return res.json({ success: true, user: safeUser });
        } catch (error) {
            console.error('Error in updateProfile:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    // Đổi mật khẩu
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            if (!newPassword) return res.status(400).json({ message: 'Mật khẩu mới không được trống.' });

            const user = await userModel.findById(userId);
            if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

            // Nếu user có mật khẩu cũ thì cần kiểm tra (đăng ký Google có thể null)
            if (user.hashPassword) {
                if (!currentPassword) return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại.' });
                const ok = await bcrypt.compare(currentPassword, user.hashPassword);
                if (!ok) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
            }

            const hashPassword = await bcrypt.hash(newPassword, 10);
            const updated = await userModel.update(userId, { hashPassword });
            if (!updated) return res.status(500).json({ message: 'Không thể cập nhật mật khẩu.' });

            return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
        } catch (error) {
            console.error('Error in changePassword:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
}

module.exports = new UserController();