import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic đăng nhập
    console.log('Login data:', formData);
  };

  return (
    <div className="login-page">
      <Header />
      <main className="login-content">
        <div className="login-container">
          <h1>Đăng nhập</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="login-button">
              Đăng nhập
            </button>
          </form>

          <div className="login-footer">
            <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
            <p><a href="/forgot-password">Quên mật khẩu?</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
