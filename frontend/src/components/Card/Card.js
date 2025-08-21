import React from 'react';
import './Card.css';

const Card = ({ item, onClick }) => {
  const handleClick = () => {
    if (onClick && typeof onClick === 'function') {
      onClick(item);
    }
  };

  return (
    <div 
      className="card" 
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img src={item.image} alt={item.title} className="card-image" />
      <span>{item.title}</span>
    </div>
  );
};

export default Card;