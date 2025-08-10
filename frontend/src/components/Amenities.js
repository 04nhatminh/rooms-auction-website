import React, {useState} from 'react';
import './Amenities.css';
import { useProduct } from '../contexts/ProductContext';
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
  const { data } = useProduct();
  const [showAll, setShowAll] = useState(false);
  const visibleAmenities = showAll ? data.amenities : data.amenities.slice(0, 10);
  return (
    <div className="amenities-section">
      <h3>Tiện nghi bạn sẽ trải nghiệm</h3>
      <div className="amenities-grid">
      {visibleAmenities.map(item => (
          <div className="amenity-item" key={item.AmenityID}>
            {/* Nếu có ảnh thì hiện ảnh, không thì chỉ hiện tên */}
            {item.AmenityImageURL ? (
              <img src={item.AmenityImageURL} alt={item.AmenityName} className="amenity-icon" />
            ) : (
              <span className="amenity-icon-placeholder" />
            )}
            <span className="amenity-text">{item.AmenityName}</span>
          </div>
        ))}
      </div>
      {data.amenities.length > 10 && (
        <button onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Ẩn bớt' : `Hiển thị tất cả ${data.amenities.length} tiện nghi`}
        </button>
      )}
    </div>
  );
};

export default Amenities;