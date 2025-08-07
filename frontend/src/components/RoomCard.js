import React from 'react';
import './RoomCard.css';

const RoomCard = ({ item, type }) => {
  return (
    <div className="room-card">
      <img src={item.image} alt={item.title} className="room-card-image" />
      <div className="room-card-body">
        <h3 className="room-card-title">{item.title}</h3>
        {/* Thêm các thông tin khác nếu cần */}
      </div>
    </div>
  );
};

export default RoomCard;