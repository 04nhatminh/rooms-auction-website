import React from 'react';
import './Footer.css';
import paypalLogo from '../../assets/paypal.png';
import zaloPayLogo from '../../assets/zalopay.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-column">
          <h4>Hỗ trợ khách hàng</h4>
          <ul>
            <li><a href="#">Câu hỏi thường gặp - FAQ</a></li>
            <li><a href="#">Hướng dẫn đấu giá</a></li>
            <li><a href="#">Trung tâm hỗ trợ</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Chính sách</h4>
          <ul>
            <li><a href="#">Điều khoản sử dụng</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Chính sách thanh toán</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Về chúng tôi</h4>
          <ul>
            <li><a href="#">Truyền thông</a></li>
            <li><a href="#">Tuyển dụng</a></li>
            <li><a href="#">Liên hệ công ty</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Đối tác thanh toán</h4>
          <div className="payment-logos">
            <img src={paypalLogo} alt="PayPal" />
            <img src={zaloPayLogo} alt="ZaloPay" />
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 A2airbnb, Inc.</span>
      </div>
    </footer>
  );
};

export default Footer;