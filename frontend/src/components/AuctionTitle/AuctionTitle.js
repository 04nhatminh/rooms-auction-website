import React from 'react';
import './AuctionTitle.css';
import shareIcon from '../../assets/share.png';
import saveIcon from '../../assets/save.png';

const AuctionTitle = ( {title} ) => {
  return (
    <div className="auction-title">
      <h2>{title}</h2>
      <div className="user-actions">
        <button className="action-btn">
          <img src={shareIcon} alt="Share" className="action-icon" />
            Chia sẻ
          </button>
          <button className="action-btn">
            <img src={saveIcon} alt="Save" className="action-icon" />
            Xem sau
          </button>
        </div>
    </div>
  );
};

export default AuctionTitle;