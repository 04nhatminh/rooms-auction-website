import React from 'react';
import RoomCard from './RoomCard';
import './RoomSection.css';

const RoomSection = ({ title, items, cardType = 'default' }) => {
  return (
    <section className="content-room-section">
      <h2>{title}</h2>
      <div className="room-card-container">
        {items.map((item, index) => (
          <RoomCard key={index} item={item} type={cardType} />
        ))}
      </div>
    </section>
  );
};

export default RoomSection;