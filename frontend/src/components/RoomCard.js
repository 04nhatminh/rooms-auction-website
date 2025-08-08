import React from 'react';
import './RoomCard.css';

const RoomCard = (item) => {
  return (
    <div className="room-card">
      <img src={item.image} alt={item.title} className="room-card-image" />
      <span>{item.title}</span>
    </div>
  );
};

export default RoomCard;