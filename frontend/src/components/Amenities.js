import React from 'react';
import './Amenities.css';

const Amenities = () => {
  return (
    <div className="amenities-section">
      <h3>Tiện nghi bạn sẽ trải nghiệm</h3>
      <div className="amenities-grid">
        <div className="amenity-item"><span>🏊</span> Bể bơi</div>
        <div className="amenity-item"><span>🍴</span> Bếp</div>
        <div className="amenity-item"><span>🚗</span> Chỗ đỗ xe miễn phí</div>
        <div className="amenity-item"><span>🛗</span> Thang máy</div>
        <div className="amenity-item"><span>🧺</span> Máy giặt</div>
        <div className="amenity-item"><span>🚫</span> Không gian làm việc</div>
        <div className="amenity-item"><span>📺</span> TV</div>
        <div className="amenity-item"><span>🌳</span> Sân chơi ngoài trời</div>
        <div className="amenity-item"><span>🏓</span> Bàn bóng bàn</div>
        <div className="amenity-item"><span>👶</span> Bể bơi</div>
      </div>
      <button className="show-all-amenities">Hiển thị tất cả 40 tiện nghi</button>
    </div>
  );
};

export default Amenities;