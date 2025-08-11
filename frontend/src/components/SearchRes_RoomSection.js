import React, { useState, useEffect } from 'react';
import RoomCard from './RoomCard';
import './SearchRes_RoomSection.css';

const SearchRes_RoomSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <section className="content-room-section">
        <div className="loading-container">
          <p>Đang tải dữ liệu...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-room-section">
      <div className="room-card-container">
      </div>
    </section>
  );
};

export default SearchRes_RoomSection;