const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class UserController {
    // Đăng ký người dùng mới
    async register(req, res) {
        try {
            const { fullName, email, password, phoneNumber, AvatarURL, rating } = req.body;

            // Kiểm tra email đã tồn tại chưa
            const existingUser = await userModel.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email đã tồn tại.' });
            }

            // Hash password
            const hashPassword = await bcrypt.hash(password, 10);

            // Tạo user mới
            const newUser = await userModel.create({
                fullName,
                email,
                hashPassword,
                phoneNumber,
                AvatarURL,
                isVerified: false,
                rating
            });

            return res.status(201).json({ message: 'Đăng ký thành công.', user: newUser });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }

    // Đăng nhập
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Tìm user theo email
            const user = await userModel.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
            }

            // So sánh password
            const isMatch = await bcrypt.compare(password, user.hashPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
            }

            // Tạo token (nếu cần)
            // const jwt = require('jsonwebtoken');
            // const token = jwt.sign({ userID: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

            return res.status(200).json({ message: 'Đăng nhập thành công.', user });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server.', error: error.message });
        }
    }
}

module.exports = new UserController();