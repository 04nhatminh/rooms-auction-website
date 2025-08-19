import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import './LoginPage.css';
import logo from '../../assets/logo.png';
import hiddenIcon from '../../assets/hidden.png';
import facebookLogo from '../../assets/facebook.png';
import googleLogo from '../../assets/google.png';
import backgroundImage from '../../assets/login_bg.jpg';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Google Login initialization
  useEffect(() => {
    const initializeGoogleLogin = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '643314900099-kcoo1iev0g768of4am5mc6n78c1bgqin.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          ux_mode: 'popup'
        });
      }
    };

    // Load Google Identity script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleLogin;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Đăng nhập thành công!');
        // Chuẩn hóa userData
        const userData = {
          fullName: data.user.fullName,
          name: data.user.fullName,   // giữ tương thích ngược nếu header dùng 'name'
          email: data.user.email,
          id: data.user.id,
          role: data.user.role
        };
        
        // Sử dụng login function từ UserContext thay vì trực tiếp localStorage
        login(userData);
        localStorage.setItem('token', data.token);
        
        // Redirect
        if (data.user.role === 'admin') {
          navigate('/admin/users-management');
        } else {
          navigate('/');
        }
      } else {
        if (data.needsVerification) {
          const resend = window.confirm(`❌ ${data.message}\n\nBạn có muốn gửi lại email xác thực không?`);
          if (resend) {
            // Resend verification email
            try {
              const resendResponse = await fetch('http://localhost:3000/user/resend-verification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: data.email || email })
              });
              const resendData = await resendResponse.json();
              alert(resendData.message);
            } catch (resendError) {
              alert('Lỗi gửi email: ' + resendError.message);
            }
          }
        } else {
          alert('❌ ' + data.message);
        }
      }
    } catch (error) {
      alert('❌ Lỗi kết nối: ' + error.message);
    }
  };

  // Handle Google login response
  const handleCredentialResponse = async (response) => {
    console.log('👉 Google response:', response);

    const id_token = response.credential;

    try {
      const res = await fetch('http://localhost:3000/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token })
      });

      const data = await res.json();

      if (res.ok) {
        // Chuẩn hóa userData
        const userData = {
          fullName: data.user.fullName,
          name: data.user.fullName,   // giữ tương thích ngược
          email: data.user.email,
          id: data.user.id,
          role: data.user.role
        };
        
        // Sử dụng login function từ UserContext
        login(userData);
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        alert('❌ Đăng nhập Google thất bại: ' + data.message);
      }
    } catch (err) {
      alert('❌ Lỗi kết nối đến server: ' + err.message);
    }
  };

  // Handle Google login button click
  const handleGoogleLogin = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-left-column">
          <header className="login-header">
<div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <img src={logo} alt="Logo" className="logo-image" />
              <span className="logo-text">bidstay</span>
            </div>
          </header>
          
          <div className="login-form">
          <h1 className="title">Đăng nhập</h1>
          <p className="subtitle">Đăng nhập để tận hưởng dịch vụ và lợi ích tuyệt vời!</p>
          <form onSubmit={handleSubmit}>
            <div className="email-input-group">
              <label htmlFor="email">Email</label>
              <input 
                className="input-email" 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="password-input-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-wrapper">
                <input 
                  className="input-password" 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <img 
                  src={hiddenIcon} 
                  alt="Toggle visibility" 
                  className="toggle-visibility" 
                  onClick={togglePasswordVisibility}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="options">
              <div className="remember-me">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Ghi nhớ đăng nhập</label>
              </div>
              <a href="#" className="forgot-password">Quên mật khẩu</a>
            </div>
            
            <button type="submit" className="signup-login-button">Đăng nhập</button>

            <p className="signup-login-link">
              Chưa có tài khoản? <a href="#" onClick={() => navigate('/signup')}>Tạo tài khoản</a>
            </p>
          </form>
          <div className="divider">
            <span className="divider-text">Hoặc đăng nhập với</span>
          </div>
          <div className="social-login">
            <button className="social-button" type="button">
              <img src={facebookLogo} alt="Facebook" />
            </button>
            <button 
              className="social-button" 
              type="button"
              onClick={handleGoogleLogin}
            >
              <img src={googleLogo} alt="Google" />
            </button>
          </div>
          </div>
        </div>

        <div className="login-image">
          <img src={backgroundImage} alt="Login Background" className="login-background" />
        </div>
      </div>
    </div>
  );
};

export default Login;