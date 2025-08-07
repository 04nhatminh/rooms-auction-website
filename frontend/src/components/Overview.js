import React from 'react';
import './Overview.css';
import starIcon from '../assets/star_filled.png';

const Overview = () => {
  return (
    <div className="overview">
      <h2>Toàn bộ căn hộ cho thuê tại Vũng Tàu, Việt Nam</h2>
      <p className="room-details">2 phòng khách - 1 phòng ngủ - 1 giường - 1 phòng tắm</p>
      <p className="rating">
        <img src={starIcon} alt="Star" className="star-icon" />
        <span className="rating-score">4,82</span>
        <span>-</span>
        <span className="rating-count">10 đánh giá</span>
      </p>
    </div>
  );
};

export default Overview;