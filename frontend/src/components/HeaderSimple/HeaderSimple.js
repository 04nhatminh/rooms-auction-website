import React from 'react';
import { Link } from 'react-router-dom';
import './HeaderSimple.css';
import logo from '../../assets/logo.png';
import HeaderUserMenu from '../HeaderUserMenu/HeaderUserMenu';
import UserAvatar from '../UserAvatar/UserAvatar';

const HeaderSimple = () => {
  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <header className="header-simple">
      <div className="header-simple-content">
        {/* Logo */}
        <div className="header-logo">
          <Link to="/">
            <img src={logo} alt="Logo" className="header-logo-image" />
            <span className="header-logo-text">bidstay</span>
          </Link>
        </div>

        {/* User Menu */}
        <div className="header-button-actions">
          <UserAvatar size="medium" />
          <HeaderUserMenu onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
};

export default HeaderSimple;
