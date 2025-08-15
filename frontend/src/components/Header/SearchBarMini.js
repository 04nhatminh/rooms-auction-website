// src/components/SearchBarMini.js
import React from 'react';
import './Header.css';
import searchIcon from '../../assets/search.png';

const SearchBarMini = ({ onActivate, searchData = {} }) => {
  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // Get display text for each field
  const getLocationText = () => {
    if (searchData.location && searchData.location.trim()) {
      const locationName = searchData.location.replace(/-/g, ' ');
      return `Chỗ ở tại ${locationName}`;
    }
    return 'Địa điểm bất kỳ';
  };

  const getDateText = () => {
    const checkin = formatDate(searchData.checkinDate);
    const checkout = formatDate(searchData.checkoutDate);
    
    if (checkin && checkout) {
      return `${checkin} - ${checkout}`;
    } else if (checkin) {
      return `Từ ${checkin}`;
    } else if (checkout) {
      return `Đến ${checkout}`;
    }
    return 'Ngày bất kỳ';
  };

  const getGuestText = () => {
    return searchData.guests || 'Thêm khách';
  };

  return (
    <div
      className="search"
      style={{ cursor: 'pointer' }}
      onClick={onActivate} // call parent function to open big search
    >
      <div className="search-content">
        <span title={getLocationText()}>{getLocationText()}</span>
        <span title={getDateText()}>{getDateText()}</span>
        <span title={getGuestText()}>{getGuestText()}</span>
      </div>
      <button className="search-icon" type="button" aria-label="Tìm kiếm">
        <img src={searchIcon} alt="" />
      </button>
    </div>
  );
};

export default SearchBarMini;
