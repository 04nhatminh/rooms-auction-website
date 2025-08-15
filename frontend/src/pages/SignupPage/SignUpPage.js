import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpPage.css';
import logo from '../../assets/logo.png';
import hiddenIcon from '../../assets/hidden.png';
import downIcon from '../../assets/down.png';
import backgroundImage from '../../assets/login_bg.jpg';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+84',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { firstName, lastName, email, phoneNumber, password, confirmPassword } = formData;
    
    // Validation
    if (!agreeTerms) {
      alert('Vui lòng đồng ý với điều khoản và chính sách!');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    if (!firstName || !lastName || !email || !password) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    
    const fullName = `${firstName} ${lastName}`;
    
    // Enable loading state
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phoneNumber
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Hiển thị thông báo thành công với hướng dẫn
        alert('🎉 Đăng ký thành công!\n\n📧 Vui lòng kiểm tra email để xác thực tài khoản.\n\n⚠️ Lưu ý: Bạn cần xác thực email trước khi có thể đăng nhập.');
        
        // Có thể redirect đến trang thông báo thay vì login
        const shouldGoToLogin = window.confirm('Bạn có muốn đi đến trang đăng nhập ngay bây giờ?\n\n(Nhớ xác thực email trước khi đăng nhập)');
        
        if (shouldGoToLogin) {
          navigate('/login');
        }
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('❌ Lỗi kết nối: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-content">
        <div className="signup-left-column">
          <header className="signup-header">
<div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <img src={logo} alt="Logo" className="logo-image" />
              <span className="logo-text">bidstay</span>
            </div>
          </header>
          
          <div className="signup-form">
            <h1 className="title">Tạo tài khoản</h1>
            <form onSubmit={handleSubmit}>
            <div className="name-input-group">

              <div className="input-column">
                <label htmlFor="firstName">Họ</label>
                <input 
                  className="input-first-name" 
                  type="text" 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>

              <div className="input-column">
                <label htmlFor="lastName">Tên</label>
                <input 
                  className="input-last-name" 
                  type="text" 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="email-input-group">
              <label htmlFor="email">Email</label>
              <input 
                className="input-email" 
                type="email" 
                id="email" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="phone-input-group">
              <div className="input-column">
                <label htmlFor="countryCode">Quốc gia</label>
                <div className="select-wrapper">
                  <select 
                    className="input-country-code" 
                    id="countryCode" 
                    value={formData.countryCode}
                    onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  >
                    <option value="+84">VN (+84)</option>
                    <option value="+1">US (+1)</option>
                    <option value="+44">UK (+44)</option>
                    <option value="+86">CN (+86)</option>
                    <option value="+81">JP (+81)</option>
                    <option value="+82">KR (+82)</option>
                    <option value="+33">FR (+33)</option>
                    <option value="+49">DE (+49)</option>
                  </select>
                  <img src={downIcon} alt="Dropdown" className="dropdown-icon" />
                </div>
              </div>

              <div className="input-column">
                <label htmlFor="phone">Số điện thoại</label>
                <input 
                  className="input-phone" 
                  type="tel" 
                  id="phone" 
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
              </div>
            </div>

            <div className="password-input-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-wrapper">
                <input 
                  className="input-password" 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <img 
                  src={hiddenIcon} 
                  alt="Toggle visibility" 
                  className="toggle-visibility" 
                  onClick={() => togglePasswordVisibility('password')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="password-input-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="password-wrapper">
                <input 
                  className="input-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirmPassword" 
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
                <img 
                  src={hiddenIcon} 
                  alt="Toggle visibility" 
                  className="toggle-visibility" 
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="options">
              <div className="terms-checkbox">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="terms">Tôi đồng ý với các Điều khoản & Chính sách</label>
              </div>
            </div>

            <button type="submit" className="signup-login-button" disabled={isLoading}>
              {isLoading ? (
                <span>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
            
            <p className="signup-login-link">
              Đã có tài khoản? <a href="#" onClick={() => navigate('/login')}>
                Đăng nhập</a>
            </p>

            </form>
          </div>
        </div>

        <div className="signup-image">
          <img src={backgroundImage} alt="Signup Background" className="signup-background" />
        </div>
      </div>
    </div>
  );
};

export default SignUp;