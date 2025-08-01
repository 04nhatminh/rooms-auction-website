const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userModel = require('../models/userModel');
const authModel = require('../models/authModel');

/**
 * Xử lý đăng nhập Google OAuth
 * Nếu tài khoản Google đã từng đăng nhập → lấy user
 * Nếu chưa có user → tạo mới + gán vào bảng OAuthAccounts
 */
exports.googleCallback = async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ message: 'Thiếu id_token từ Google' });
  }

  try {
    // 1. Xác minh token với Google
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const {
      sub: googleUID,   // ID duy nhất của người dùng từ Google
      email,
      name,
      picture
    } = payload;

    if (!email || !googleUID) {
      return res.status(400).json({ message: 'Không lấy được thông tin người dùng từ Google' });
    }

    // 2. Tìm trong bảng OAuthAccounts
    const oauthAccount = await authModel.findOAuthAccount('google', googleUID);
    let user;

    if (oauthAccount) {
      // 3. Nếu đã có liên kết OAuth → lấy user theo UserID
      user = await userModel.findById(oauthAccount.UserID);
    } else {
      // 4. Nếu chưa có OAuthAccount → kiểm tra email đã có user chưa
      user = await userModel.findOne({ email });

      if (!user) {
        // 5. Nếu user chưa tồn tại → tạo user mới
        const newUser = await userModel.create({
          fullName: name,
          email,
          hashPassword: null,             // Không có mật khẩu khi đăng nhập Google
          phoneNumber: '',
          AvatarURL: picture,
          isVerified: true,              // Google user mặc định xác thực
          rating: 0.0,
          verificationToken: null,
          verificationTokenExpires: null
        });

        user = newUser;
      }

      // 6. Tạo bản ghi OAuthAccounts
      await authModel.createOAuthAccount({
        provider: 'google',
        providerUID: googleUID,
        userID: user.id
      });
    }

    // 7. Trả thông tin user cho frontend
    return res.status(200).json({ user });
  } catch (err) {
    console.error('[Google OAuth Error]', err);
    return res.status(401).json({ message: 'Xác thực Google thất bại' });
  }
};
