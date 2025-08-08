import React from 'react';
import './Card.css';

const Card = ({ item }) => {
  return (
    <div className="card">
      <img src={item.image} alt={item.title} className="card-image" />
      <span>{item.title}</span>
    </div>
  );
};

export default Card;