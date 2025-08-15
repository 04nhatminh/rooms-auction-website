import React from 'react';
import './TabLayout.css';
import RoomIcon from '../../assets/bed.png';
import AuctionIcon from '../../assets/auction.png';

const TabLayout = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'auction',
      icon: AuctionIcon,
      mainText: 'Phiên đấu giá đang diễn ra',
      subscript: 'Tham gia đặt giá để thuê phòng giá tốt nhất!'

    },
    {
      id: 'room',
      icon: RoomIcon,
      mainText: 'Các phòng khác',
      subscript: 'Chưa có đấu giá? Tạo phiên đấu giá của riêng bạn!'
    }
  ];

  return (
    <div className="tab-layout">
      <div className="tab-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="tab-content">
              <div className="tab-icon">
                <img src={tab.icon} alt={tab.mainText} />
              </div>
              <div className="tab-text">
                <div className="tab-main-text">{tab.mainText}</div>
                <div className="tab-subscript">{tab.subscript}</div>
              </div>
            </div>
            <div className={`tab-line ${activeTab === tab.id ? 'active' : ''}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabLayout;
