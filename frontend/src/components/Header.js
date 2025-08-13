import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../assets/logo.png';
import SearchBarMini from './SearchBarMini';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

const Header = () => {
  const [showFullSearch, setShowFullSearch] = useState(false);

  return (
    <header className={`header ${showFullSearch ? 'expanded' : ''}`}>
      <div className="header-top">
        <div className="logo">
          <Link to="/" >
            <img src={logo} alt="Logo" className="logo-image" />
            <span className="logo-text">bidstay</span>
          </Link>
        </div>

        {!showFullSearch && (
          <div className="header-mini-slot">
            <SearchBarMini onActivate={() => setShowFullSearch(true)} />
          </div>
        )}

        <div className="header-button-actions">
          <button className="circle-btn user-btn">U</button>
          
          <UserMenu onLogout={() => {/* your logout logic */}} />
        </div>
      </div>

      {showFullSearch && (
        <div className="header-full-floating">
          <SearchBar onClose={() => setShowFullSearch(false)} />
        </div>
      )}
    </header>

  );
};

export default Header;
