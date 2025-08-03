import React from 'react';
import './Header.css';
import logo from '../assets/logo.png';
import menuIcon from '../assets/menu.png';
import searchIcon from '../assets/search.png';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="Logo" className="logo-image" />
        <span className="logo-text">bidstay</span>
      </div>
      <nav className="search">
        <div className="search-content">
          <span>Địa điểm bất kỳ</span>
          <span>18 thg 7 - 23 thg 7</span>
          <span>Thêm khách</span>
        </div>
        <span className="search-icon">
          <img src={searchIcon} alt="Search" />
        </span>
      </nav>
      <div className="header-button-actions">
        <button className="circle-btn user-btn">U</button>
        <button className="circle-btn menu-btn">
          <img src={menuIcon} alt="Menu" className="menu-icon" />
        </button>
      </div>
    </header>
  );
};

export default Header;