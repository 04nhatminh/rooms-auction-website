import React from 'react';
import './Rating.css';
import starIcon from '../assets/star_filled.png';
import broomIcon from '../assets/broom.png';
import locationPinIcon from '../assets/location_pin.png';
import waiterIcon from '../assets/waiter.png';
import priceTagIcon from '../assets/price_tag.png';
import talkingIcon from '../assets/talking.png';
import restIcon from '../assets/rest.png';

const RatingBar = ({ label, score }) => (
  <div className="rating-bar-container">
    <span>{label}</span>
    <div className="bar-wrapper">
      <div className="bar" style={{ width: `${(score / 10) * 100}%` }}></div>
    </div>
  </div>
);

const CategoryCard = ({ title, score, icon }) => (
  <div className="category-card">
    <span className="category-title">{title}</span>
    <span className="category-score">{score}</span>
    <img src={icon} alt={title} className="category-icon" />
  </div>
);

const Rating = () => {
  return (
    <div className="rating-section">
      <h3>Đánh giá của khách hàng</h3>
      <h2><img src={starIcon} alt="Star Icon" /> 4,9 - 39 đánh giá</h2>
      <div className="detailed-ratings">
        <div className="rating-bars-column">
          <RatingBar label="5" score={9.8} />
          <RatingBar label="4" score={8.5} />
          <RatingBar label="3" score={4} />
          <RatingBar label="2" score={0} />
          <RatingBar label="1" score={0} />
        </div>
        <div className="line"></div>
        <div className="categories-column">
          <CategoryCard title="Sạch sẽ" score="4.9" icon={broomIcon} />
          <CategoryCard title="Vị trí" score="4.8" icon={locationPinIcon} />
          <CategoryCard title="Phục vụ" score="4.9" icon={waiterIcon} />
          <CategoryCard title="Giá trị" score="4.7" icon={priceTagIcon} />
          <CategoryCard title="Giao tiếp" score="4.6" icon={talkingIcon} />
          <CategoryCard title="Tiện nghi" score="4.8" icon={restIcon} />
        </div>
      </div>
    </div>
  );
};

export default Rating;