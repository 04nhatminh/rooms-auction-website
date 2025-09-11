import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpPage.css';
import logo from '../../assets/logo.png';
import hiddenIcon from '../../assets/hidden.png';
import viewIcon from '../../assets/view.png';
import downIcon from '../../assets/down.png';
import backgroundImage from '../../assets/login_bg.jpg';

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '')) || 'http://localhost:3000';

const SignUp = () => {
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = [
    "Tối thiểu 8 ký tự",
    "Có chữ hoa (A-Z)",
    "Có chữ thường (a-z)",
    "Có số (0-9)",
    "Có ký tự đặc biệt (!@#$%^&*)"
  ];

  const phoneRegex = /^0\d{9,10}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Ẩn error khi focus hoặc thay đổi input
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
    if (!firstName || !lastName || !email || !password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng.");
      return;
    }
    if (!passwordRegex.test(password)) {
      setError("Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra lại các yêu cầu.");
      return;
    }
    
    const fullName = `${firstName} ${lastName}`;
    
    // Enable loading state
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/register`, {
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
        if (data.message === 'Email đã tồn tại') {
          setError('Email đã tồn tại!');
        } else {
          setError(data.message || 'Đăng ký thất bại!');
        }
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
            {error && (
              <div style={{ color: '#ef4444', marginBottom: '12px', fontWeight: 500, fontSize: '15px' }}>
                {error}
              </div>
            )}
            <div className="name-input-group">

              <div className="input-column">
                <label htmlFor="firstName">Họ <span style={{color: '#ef4444'}}>*</span></label>
                <input 
                  className="input-first-name" 
                  type="text" 
                  id="firstName" 
                  value={formData.firstName}
                  placeholder="Nguyễn"
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>

              <div className="input-column">
                <label htmlFor="lastName">Tên <span style={{color: '#ef4444'}}>*</span></label>
                <input 
                  className="input-last-name" 
                  type="text" 
                  id="lastName" 
                  value={formData.lastName}
                  placeholder="Văn An"
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="email-input-group">
              <label htmlFor="email">Email <span style={{color: '#ef4444'}}>*</span></label>
              <input 
                className="input-email" 
                type="email" 
                id="email" 
                value={formData.email}
                placeholder="vanan@gmail.com"
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
                  placeholder="0912345678"
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
                    onFocus={() => setShowPasswordPopup(true)}
                    onBlur={() => setShowPasswordPopup(false)}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                />
                  <img
                    src={showPassword ? viewIcon : hiddenIcon}
                    alt={showPassword ? "Hiện mật khẩu" : "Ẩn mật khẩu"}
                    className="toggle-visibility"
                    onClick={() => togglePasswordVisibility('password')}
                    style={{ cursor: 'pointer', marginLeft: 8, width: 24, height: 24 }}
                  />
                  {showPasswordPopup && (
                    <div style={{
                      position: 'absolute',
                      top: '110%',
                      left: 0,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      padding: '16px',
                      zIndex: 10,
                      width: '320px',
                    }}>
                      <strong>Yêu cầu mật khẩu:</strong>
                      <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'disc inside'}}>
                        {passwordRequirements.map((req, idx) => (
                          <li key={idx} style={{fontSize: '14px', color: '#374151'}}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                    src={showConfirmPassword ? viewIcon : hiddenIcon}
                    alt={showConfirmPassword ? "Hiện mật khẩu" : "Ẩn mật khẩu"}
                    className="toggle-visibility"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    style={{ cursor: 'pointer', marginLeft: 8, width: 24, height: 24 }}
                  />
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