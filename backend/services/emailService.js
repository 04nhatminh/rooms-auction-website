const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Gửi email xác thực
    async sendVerificationEmail(to, fullName, verificationToken) {
        try {
            // Use environment variable or fallback to localhost:3000
            const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
            const verificationUrl = `${baseUrl}/user/verify?token=${verificationToken}`;
            
            const mailOptions = {
                from: `"${process.env.FROM_NAME || 'BidStay Platform'}" <${process.env.FROM_EMAIL}>`,
                to: to,
                subject: '🔐 Xác thực tài khoản BidStay',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #008489, #00b4d8); padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0;">🏠 BidStay</h1>
                            <p style="margin: 10px 0 0 0;">Chào mừng bạn đến với nền tảng đấu giá thuê nhà!</p>
                        </div>
                        
                        <div style="padding: 30px; background: #f8f9fa;">
                            <h2 style="color: #333;">Xin chào ${fullName}!</h2>
                            <p style="color: #666; line-height: 1.6;">
                                Cảm ơn bạn đã đăng ký tài khoản BidStay. Để hoàn tất quá trình đăng ký, 
                                vui lòng click vào nút bên dưới để xác thực email của bạn:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationUrl}" 
                                   style="background: #008489; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 25px; display: inline-block;
                                          font-weight: bold; transition: background 0.3s;">
                                    ✅ Xác thực tài khoản
                                </a>
                            </div>
                            
                            <p style="color: #666; font-size: 14px;">
                                Nếu nút không hoạt động, vui lòng copy và paste link sau vào trình duyệt:<br>
                                <a href="${verificationUrl}" style="color: #008489;">${verificationUrl}</a>
                            </p>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                <strong>Lưu ý:</strong> Link xác thực sẽ hết hạn sau 24 giờ.
                            </p>
                        </div>
                        
                        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                            <p>© 2025 BidStay Platform. All rights reserved.</p>
                            <p>Nếu bạn không yêu cầu xác thực này, vui lòng bỏ qua email.</p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Error sending email:', error);
            throw error;
        }
    }

    // Gửi email reset password
    async sendPasswordResetEmail(to, fullName, resetToken) {
        try {
            const baseUrl = process.env.CLIENT_ORIGIN|| 'http://localhost:3001';
            const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
                to: to,
                subject: '🔑 Đặt lại mật khẩu BidStay',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                        <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0;">🏠 BidStay</h1>
                            <p style="margin: 10px 0 0 0;">Yêu cầu đặt lại mật khẩu</p>
                        </div>
                        
                        <div style="padding: 30px; background: #f8f9fa;">
                            <h2 style="color: #333;">Xin chào ${fullName}!</h2>
                            <p style="color: #666; line-height: 1.6;">
                                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
                                Vui lòng click vào nút bên dưới để đặt lại mật khẩu:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" 
                                   style="background: #ff6b6b; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 25px; display: inline-block;
                                          font-weight: bold;">
                                    🔑 Đặt lại mật khẩu
                                </a>
                            </div>
                            
                            <p style="color: #666; font-size: 14px;">
                                Nếu nút không hoạt động, vui lòng copy và paste link sau vào trình duyệt:<br>
                                <a href="${resetUrl}" style="color: #ff6b6b;">${resetUrl}</a>
                            </p>
                            
                            <p style="color: #666; font-size: 14px; margin-top: 20px;">
                                <strong>Lưu ý:</strong> Link đặt lại mật khẩu sẽ hết hạn sau 1 giờ.
                            </p>
                            
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                            </p>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Password reset email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Error sending reset email:', error);
            throw error;
        }
    }

    // Test kết nối SMTP
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP connection successful');
            return true;
        } catch (error) {
            console.error('❌ SMTP connection failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();