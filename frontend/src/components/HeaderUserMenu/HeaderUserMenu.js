import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import menuIcon from '../../assets/menu.png';
import UserAvatar from '../UserAvatar/UserAvatar';
import './HeaderUserMenu.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const HeaderUserMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleLogout = async () => {
    try {
      // gọi BE để xóa cookie bidstay_token
      await fetch(`${API_BASE_URL}/user/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // không cần chặn UI nếu request fail
      console.warn('Logout call failed:', e);
    } finally {
      // dọn cache UI
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      setUser(null);

      // Gửi event để thông báo các component khác về sự thay đổi user data
      window.dispatchEvent(new CustomEvent('userDataChanged'));
      
      // navigate('/login');
    }
  };

  return (
    <div className="dropdown-user-info" >
      <UserAvatar size="medium" />
      <button
        className="circle-btn menu-btn btn"
        type="button"
        id="userMenuButton"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <img src={menuIcon} alt="Menu" className="menu-icon" />
      </button>

      <ul className="dropdown-menu dropdown-menu-end custom-dropdown">
        <li>
          <button className="dropdown-item" type="button" onClick={() => navigate('/favorite')}>
            <i className="fa-regular fa-heart me-2"></i>Danh sách yêu thích
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button" onClick={() => navigate('/auction-history')}>
            <i className="fa-solid fa-gavel me-2"></i>Lịch sử đấu giá
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button" onClick={() => navigate('/transaction-history')}>
            <i className="fa-solid fa-clock-rotate-left me-2"></i>Lịch sử giao dịch
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button" onClick={() => navigate('/profile')}>
            <i className="fa-solid fa-user me-2"></i>Hồ sơ
          </button>
        </li>

        <li><hr className="dropdown-divider" /></li>

        <li>
          <button className="dropdown-item" type="button" onClick={() => navigate('/notifications')}>
            <i className="fa-solid fa-bell me-2"></i>Thông báo
          </button>
        </li>

        <li><hr className="dropdown-divider" /></li>

        <li>
          <button className="dropdown-item" type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </li>
      </ul>
    </div>
  );
};

export default HeaderUserMenu;

