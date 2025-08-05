import React from 'react';
import './Amenities.css';
import carIcon from '../assets/car.png';
import elevatorIcon from '../assets/elevator.png';
import horseIcon from '../assets/horse.png';
import kitchenIcon from '../assets/kitchen.png';
import laundryIcon from '../assets/laundry.png';
import pingPongIcon from '../assets/ping_pong.png';
import swimmingPoolIcon from '../assets/swimming_pool.png';
import televisionIcon from '../assets/television.png';
import workspaceIcon from '../assets/workspace.png';

const Amenities = () => {
  return (
    <div className="amenities-section">
      <h3>Tiện nghi bạn sẽ trải nghiệm</h3>
      <div className="amenities-grid">
        <div className="amenity-item">
          <img src={swimmingPoolIcon} alt="Bể bơi" className="amenity-icon" />
          <span className="amenity-text">Bể bơi</span>
        </div>
        <div className="amenity-item">
          <img src={kitchenIcon} alt="Bếp" className="amenity-icon" />
          <span className="amenity-text">Bếp</span>
        </div>
        <div className="amenity-item">
          <img src={carIcon} alt="Chỗ đỗ xe miễn phí" className="amenity-icon" />
          <span className="amenity-text">Chỗ đỗ xe miễn phí</span>
        </div>
        <div className="amenity-item">
          <img src={elevatorIcon} alt="Thang máy" className="amenity-icon" />
          <span className="amenity-text">Thang máy</span>
        </div>
        <div className="amenity-item">
          <img src={laundryIcon} alt="Máy giặt" className="amenity-icon" />
          <span className="amenity-text">Máy giặt</span>
        </div>
        <div className="amenity-item">
          <img src={workspaceIcon} alt="Không gian làm việc" className="amenity-icon" />
          <span className="amenity-text">Không gian làm việc</span>
        </div>
        <div className="amenity-item">
          <img src={televisionIcon} alt="TV" className="amenity-icon" />
          <span className="amenity-text">TV</span>
        </div>
        <div className="amenity-item">
          <img src={horseIcon} alt="Sân chơi ngoài trời" className="amenity-icon" />
          <span className="amenity-text">Sân chơi ngoài trời</span>
        </div>
        <div className="amenity-item">
          <img src={pingPongIcon} alt="Bàn bóng bàn" className="amenity-icon" />
          <span className="amenity-text">Bàn bóng bàn</span>
        </div>
        <div className="amenity-item">
          <img src={swimmingPoolIcon} alt="Bể bơi" className="amenity-icon" />
          <span className="amenity-text">Bể bơi</span>
        </div>
      </div>
      <button>Hiển thị tất cả 40 tiện nghi</button>
    </div>
  );
};

export default Amenities;