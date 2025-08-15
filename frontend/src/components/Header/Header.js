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

  // Shared search state
  const [searchData, setSearchData] = useState({
    location: '',
    checkinDate: '',
    checkoutDate: '',
    guests: ''
  });

  const [guestCounts, setGuestCounts] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });

  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

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

  // Update guest display text when guest counts change
  const updateGuestDisplayText = (counts) => {
    const totalGuests = counts.adults + counts.children;
    let displayText = '';
    
    if (totalGuests === 0) {
      displayText = '';
    } else if (totalGuests === 1) {
      displayText = '1 khách';
    } else {
      displayText = `${totalGuests} khách`;
    }
    
    // Add infant info if any
    if (counts.infants > 0) {
      if (displayText) {
        displayText += `, ${counts.infants} em bé`;
      } else {
        displayText = `${counts.infants} em bé`;
      }
    }
    
    setSearchData(prev => ({
      ...prev,
      guests: displayText
    }));
  };

  // Update guest display when guest counts change
  useEffect(() => {
    updateGuestDisplayText(guestCounts);
  }, [guestCounts]);

  // Handle data updates from SearchBar
  const handleSearchDataUpdate = (newData) => {
    setSearchData(newData);
  };

  const handleGuestCountsUpdate = (newCounts) => {
    setGuestCounts(newCounts);
  };

  const handleLocationUpdate = (locationId, type) => {
    setSelectedLocationId(locationId);
    setSelectedType(type);
  };

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
            <SearchBarMini 
              onActivate={() => setShowFullSearch(true)}
              searchData={searchData}
            />
          </div>
        ) : (
          <div className="header-full-search">
            <SearchBar 
              onClose={() => setShowFullSearch(false)}
              initialSearchData={searchData}
              initialGuestCounts={guestCounts}
              initialLocationId={selectedLocationId}
              initialType={selectedType}
              onSearchDataUpdate={handleSearchDataUpdate}
              onGuestCountsUpdate={handleGuestCountsUpdate}
              onLocationUpdate={handleLocationUpdate}
            />
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
