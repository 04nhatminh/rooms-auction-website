import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setStatus('Vui lòng nhập email.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`${API_BASE_URL}/user/request-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Vui lòng kiểm tra email để đặt lại mật khẩu.');
      } else {
        setStatus('❌ ' + (data.message || 'Không thể gửi email.'));
      }
    } catch (err) {
      setStatus('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
        <div className="forgot-password-container">
            <h1>Quên mật khẩu</h1>
            <form onSubmit={handleSubmit}>
                <label>Email:</label>
                <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                />
                <button type="submit" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
            </form>
            {status && <div style={{ marginTop: 16 }}>{status}</div>}
            <button onClick={() => navigate('/login')}>Quay lại đăng nhập</button>
        </div>
    </div>
  );
}