import React from 'react';
import './SearchBar.css';
import searchIcon from '../assets/search.png';

const SearchBar = () => {
  return (
    <div className="search-container">
      <form className="search-bar">
        <div className="search-input">
          <label>Địa điểm</label>
          <input type="text" placeholder="Tìm kiếm điểm đến" />
        </div>
        <div className="search-input">
          <label>Nhận phòng</label>
          <input type="text" placeholder="Thêm ngày" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'}/>
        </div>
        <div className="search-input">
          <label>Trả phòng</label>
          <input type="text" placeholder="Thêm ngày" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'}/>
        </div>
        <div className="search-input">
          <label>Khách</label>
          <input type="text" placeholder="Thêm khách" />
        </div>
        
        <button type="submit" className="search-button">
          <img src={searchIcon} alt="Search" className='search-icon' />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;