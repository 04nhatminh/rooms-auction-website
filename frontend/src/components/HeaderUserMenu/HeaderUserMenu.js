import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import menuIcon from '../../assets/menu.png';
import './HeaderUserMenu.css';

const HeaderUserMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    // navigate('/login');
  };

  return (
    <div className="dropdown user-info" 
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button className="circle-btn user-btn">U</button>
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
          <button className="dropdown-item" type="button">
            <i className="fa-regular fa-heart me-2"></i>Danh sách yêu thích
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-gavel me-2"></i>Lịch sử đấu giá
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-clock-rotate-left me-2"></i>Lịch sử mua hàng
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-user me-2"></i>Hồ sơ
          </button>
        </li>

        <li><hr className="dropdown-divider" /></li>

        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-bell me-2"></i>Thông báo
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-gear me-2"></i>Cài đặt tài khoản
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-language me-2"></i>Ngôn ngữ & Tiền tệ
          </button>
        </li>
        <li>
          <button className="dropdown-item" type="button">
            <i className="fa-solid fa-circle-info me-2"></i>Trung tâm trợ giúp
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

