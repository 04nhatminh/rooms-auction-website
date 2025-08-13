import React, { useState, useEffect, useRef } from 'react';
import './UserMenu.css';

const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const name = user?.fullName || user?.name || 'User';
  const firstName = name?.trim()?.split(' ').slice(-1)[0] || 'User';
  const initial = (name?.trim()?.[0] || 'U').toUpperCase();
  const avatarUrl = user?.avatarURL || user?.AvatarURL || '';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown user-info" id="userInfo" ref={menuRef}>
      <button
        className="user-menu-btn"
        type="button"
        aria-expanded={open}
        id="welcomeText"
        onClick={() => setOpen((v) => !v)}
        title={`Chào mừng, ${firstName}!`}
      >
        <span className="avatar-badge" aria-hidden="true">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="avatar-img" />
          ) : (
            <span className="avatar-initial">{initial}</span>
          )}
        </span>
        <span className="user-name">Chào mừng, {firstName}!</span>
        <svg className={`caret ${open ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul className="dropdown-menu dropdown-menu-end custom-dropdown">
          <li><button className="dropdown-item" type="button">Danh sách yêu thích</button></li>
          <li><button className="dropdown-item" type="button">Lịch sử đấu giá</button></li>
          <li><button className="dropdown-item" type="button">Lịch sử mua hàng/thanh toán</button></li>
          <li><button className="dropdown-item" type="button">Hồ sơ</button></li>
          <li><hr className="dropdown-divider" /></li>
          <li><button className="dropdown-item" type="button">Thông báo</button></li>
          <li><button className="dropdown-item" type="button">Cài đặt tài khoản</button></li>
          <li><button className="dropdown-item" type="button">Ngôn ngữ & Tiền tệ</button></li>
          <li><button className="dropdown-item" type="button">Trung tâm trợ giúp</button></li>
          <li><hr className="dropdown-divider" /></li>
          <li><button className="dropdown-item" type="button" onClick={onLogout}>Đăng xuất</button></li>
        </ul>
      )}
    </div>
  );
};

export default UserMenu;