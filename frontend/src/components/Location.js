import React from 'react';
import './Location.css';

const Location = () => {
  return (
    <div className="location-section">
      <h3>Nơi bạn sẽ đến</h3>
      <span>Đà Lạt, Lâm Đồng, Việt Nam</span>
      <div className="location-map"></div>
    </div>
  );
};

export default Location;