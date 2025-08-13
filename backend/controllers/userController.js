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

            // Tìm user theo email
            const user = await userModel.findOne({ email });
            if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
            }

            // Kiểm tra xác thực email
            if (!user.isVerified) {
            return res.status(400).json({ 
                message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.',
                needsVerification: true,
                email: email
            });
            }

            // Kiểm tra password
            const isMatch = await bcrypt.compare(password, user.hashPassword);
            if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
            }

            // Tạo JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role || 'guest'  // Nếu bạn lưu role trong DB
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1d' }
            );

            // Trả về dữ liệu
            const { hashPassword, verificationToken, verificationTokenExpires, ...safeUser } = user;

            return res.status(200).json({
            message: 'Đăng nhập thành công.',
            user: safeUser,
            token
            });
        } catch (error) {
            console.error('Error in login:', error);
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
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
}

module.exports = new UserController();