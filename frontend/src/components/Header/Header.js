import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/logo.png';
import SearchBarMini from './SearchBarMini';
import SearchBar from '../SearchBar/SearchBar';
import HeaderUserMenu from '../HeaderUserMenu/HeaderUserMenu';

const Header = () => {
  const [showFullSearch, setShowFullSearch] = useState(false);
  const headerRef = useRef(null);

  // Handle click outside header to close full search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowFullSearch(false);
      }
    };

    if (showFullSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFullSearch]);

  return (
    <header ref={headerRef} className={`header ${showFullSearch ? 'expanded' : ''}`}>
      <div className="header-top">
        {!showFullSearch && (
          <div className="header-logo">
            <Link to="/" >
              <img src={logo} alt="Logo" className="header-logo-image" />
              <span className="header-logo-text">bidstay</span>
            </Link>
          </div>
        )}

        {!showFullSearch ? (
          <div className="header-mini-slot">
            <SearchBarMini onActivate={() => setShowFullSearch(true)} />
          </div>
        ) : (
          <div className="header-full-search">
            <SearchBar onClose={() => setShowFullSearch(false)} />
          </div>
        )}

        {!showFullSearch && (
          <div className="header-button-actions">
            <button className="circle-btn user-btn">U</button>
            
            <HeaderUserMenu onLogout={() => {/* your logout logic */}} />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
