import React from 'react';
import './Card.css';

const Card = ({ item, type }) => {
  return (
    <div className="card">
      <img src={item.image} alt={item.title} className="card-image" />
      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        {/* Thêm các thông tin khác nếu cần */}
      </div>
    </div>
  );
};

export default Card;