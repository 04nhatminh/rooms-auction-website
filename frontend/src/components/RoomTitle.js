import React from 'react';
import { useProduct } from '../contexts/ProductContext';
import './RoomTitle.css';
import shareIcon from '../assets/share.png';
import heartIcon from '../assets/heart.png';
import saveIcon from '../assets/save.png';

const RoomTitle = () => {
  const { data, setData } = useProduct();
  return (
    <div className="room-title">
      <h2>{data?.details?.Name}</h2>
      <div className="user-actions">
        <button className="action-btn">
          <img src={shareIcon} alt="Share" className="action-icon" />
            Chia sẻ
          </button>
          <button className="action-btn">
            <img src={heartIcon} alt="Favorite" className="action-icon" />
            Yêu thích
          </button>
          <button className="action-btn">
            <img src={saveIcon} alt="Save" className="action-icon" />
            Xem sau
          </button>
        </div>
    </div>
  );
};

export default RoomTitle;