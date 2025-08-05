const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

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
                // Redirect to success page
                return res.redirect('/verification-success.html');
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

            // Kiểm tra user đã xác thực email chưa
            if (!user.isVerified) {
                return res.status(400).json({ 
                    message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.',
                    needsVerification: true,
                    email: email
                });
            }

            // So sánh password
            const isMatch = await bcrypt.compare(password, user.hashPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
            }

            // Loại bỏ sensitive data trước khi trả về
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
}

module.exports = new UserController();