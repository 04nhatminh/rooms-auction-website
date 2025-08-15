import React from 'react';
import './VerificationSuccessPage.css';

const VerificationSuccessPage = () => {
  return (
    <div className="verification-success-page">
      <div className="verification-container">
        <div className="success-icon">
          <div className="icon-wrapper">
            <svg className="checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h1 className="success-title">Xác thực thành công!</h1>
        <p className="success-message">
          Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
        </p>
        <a href="/login" className="login-button">
          Đăng nhập
        </a>
      </div>
    </div>
  );
};

export default VerificationSuccessPage;
