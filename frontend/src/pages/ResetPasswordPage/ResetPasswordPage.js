import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPasswordPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export default function ResetPasswordPage() {
  const [sp] = useSearchParams();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const navigate = useNavigate();
  const token = sp.get('token');

  const passwordRequirements = [
    "Tối thiểu 8 ký tự",
    "Có chữ hoa (A-Z)",
    "Có chữ thường (a-z)",
    "Có số (0-9)",
    "Có ký tự đặc biệt (!@#$%^&*)"
  ];
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setStatus('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (!passwordRegex.test(password)) {
      setStatus('❌ Mật khẩu chưa đủ mạnh. Vui lòng kiểm tra lại các yêu cầu.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch(`${API_BASE_URL}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Đổi mật khẩu thành công. Bạn có thể đăng nhập.');
      } else {
        setStatus('❌ ' + (data.message || 'Không thể đổi mật khẩu.'));
      }
    } catch (err) {
      setStatus('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
        <div className="reset-password-container">
            <h1>Đặt lại mật khẩu</h1>
            <form onSubmit={handleSubmit}>
                <label>Mật khẩu mới:</label>
                <input
                type="password"
                value={password}
                onFocus={() => setShowPasswordPopup(true)}
                onBlur={() => setShowPasswordPopup(false)}
                onChange={e => setPassword(e.target.value)}
                required
                />
                {showPasswordPopup && (
                  <div className="password-popup">
                    <strong>Yêu cầu mật khẩu:</strong>
                    <ul>
                      {passwordRequirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button type="submit" disabled={loading}>
                {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
            </form>
            {status && <div style={{ marginTop: 16 }}>{status}</div>}
            <button onClick={() => navigate('/login')}>Quay lại đăng nhập</button>
        </div>
    </div>
  );
}