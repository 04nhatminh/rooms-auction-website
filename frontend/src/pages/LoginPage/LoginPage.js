// src/pages/LoginPage/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../../assets/logo.png';
import hiddenIcon from '../../assets/hidden.png';
import facebookLogo from '../../assets/facebook.png';
import googleLogo from '../../assets/google.png';
import backgroundImage from '../../assets/login_bg.jpg';

const API_BASE_URL =
  (process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '')) || 'http://localhost:3000';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- helpers: storage & persist ---
  const getStorage = () => (rememberMe ? window.localStorage : window.sessionStorage);
  const getOtherStorage = () => (rememberMe ? window.sessionStorage : window.localStorage);

  const persistUser = (user, token) => {
    // clear ở kho còn lại để tránh “hai nơi hai bản”
    try {
      getOtherStorage().removeItem('userData');
      getOtherStorage().removeItem('token');
    } catch {}

    const stash = getStorage();
    const userData = {
      fullName: user.fullName,
      name: user.fullName,   // giữ tương thích với UI cũ
      email: user.email,
      id: user.id,
      role: user.role,
      _ts: Date.now(),
    };
    stash.setItem('userData', JSON.stringify(userData));
  };

  // Google Login init
  useEffect(() => {
    const initializeGoogleLogin = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '643314900099-kcoo1iev0g768of4am5mc6n78c1bgqin.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          ux_mode: 'popup',
        });
      }
    };

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleLogin;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- form login ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // nhận cookie nếu server set
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        alert('✅ Đăng nhập thành công!');
        persistUser(data.user, data.token);
        if (data.user.role === 'admin') navigate('/admin/users-management');
        else navigate('/');
      } else {
        if (data.needsVerification) {
          const resend = window.confirm(`❌ ${data.message}\n\nBạn có muốn gửi lại email xác thực không?`);
          if (resend) {
            try {
              const resendRes = await fetch(`${API_BASE_URL}/user/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: data.email || email }),
              });
              const resendData = await resendRes.json();
              alert(resendData.message);
            } catch (err) {
              alert('Lỗi gửi email: ' + err.message);
            }
          }
        } else {
          alert('❌ ' + (data.message || 'Đăng nhập thất bại'));
        }
      }
    } catch (err) {
      alert('❌ Lỗi kết nối: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Google login ---
  const handleCredentialResponse = async (response) => {
    const id_token = response.credential;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_token }),
      });
      const data = await res.json();
      if (res.ok) {
        persistUser(data.user, data.token);
        navigate('/');
      } else {
        alert('❌ Đăng nhập Google thất bại: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Lỗi kết nối đến server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (window.google) window.google.accounts.id.prompt();
  };

  const togglePasswordVisibility = () => setShowPassword(v => !v);

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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="password-input-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="password-wrapper">
                  <input
                    className="input-password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <img
                    src={hiddenIcon}
                    alt="Hiện/ẩn mật khẩu"
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
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => navigate('/forgot-password')}
                >
                  Quên mật khẩu
                </button>
              </div>

              <button type="submit" className="signup-login-button" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>

              <p className="signup-login-link">
                Chưa có tài khoản?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>
                  Tạo tài khoản
                </a>
              </p>
            </form>

            <div className="divider">
              <span className="divider-text">Hoặc đăng nhập với</span>
            </div>

            <div className="social-login">
              <button className="social-button" type="button">
                <img src={facebookLogo} alt="Facebook" />
              </button>
              <button className="social-button" type="button" onClick={handleGoogleLogin}>
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

// Xóa dữ liệu đăng nhập khi đăng xuất
// localStorage.removeItem('userData'); localStorage.removeItem('token');
// sessionStorage.removeItem('userData'); sessionStorage.removeItem('token');