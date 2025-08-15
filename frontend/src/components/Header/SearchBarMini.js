// src/components/SearchBarMini.js
import React from 'react';
import './Header.css';
import searchIcon from '../../assets/search.png';

const SearchBarMini = ({ onActivate }) => {
  return (
    <div
      className="search"
      style={{ cursor: 'pointer' }}
      onClick={onActivate} // call parent function to open big search
    >
      <div className="search-content">
        <span>Địa điểm bất kỳ</span>
        <span>Ngày bất kỳ</span>
        <span>Thêm khách</span>
      </div>
      <button className="search-icon" type="button" aria-label="Tìm kiếm">
        <img src={searchIcon} alt="" />
      </button>
    </div>
  );
};

export default SearchBarMini;
