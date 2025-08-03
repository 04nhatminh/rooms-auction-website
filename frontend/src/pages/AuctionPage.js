import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AuctionPage.css';

const AuctionPage = () => {
  const [currentBid, setCurrentBid] = useState(500000);
  const [userBid, setUserBid] = useState('');

  const handleBidSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic đấu giá
    console.log('Bid submitted:', userBid);
  };

  return (
    <div className="auction-page">
      <Header />
      <main className="auction-content">
        <div className="auction-header">
          <h1>Đấu giá phòng trọ</h1>
          <div className="auction-timer">
            <span>Thời gian còn lại: 2h 30m 15s</span>
          </div>
        </div>

        <div className="auction-body">
          <div className="room-info">
            <img src="/api/placeholder/400/300" alt="Room" />
            <div className="room-details">
              <h2>Phòng trọ cao cấp tại Quận 1</h2>
              <p>25m² • 1 phòng ngủ • 1 phòng tắm</p>
            </div>
          </div>

          <div className="bidding-section">
            <div className="current-bid">
              <h3>Giá hiện tại</h3>
              <span className="bid-amount">{currentBid.toLocaleString()} VNĐ</span>
            </div>

            <form onSubmit={handleBidSubmit} className="bid-form">
              <input
                type="number"
                value={userBid}
                onChange={(e) => setUserBid(e.target.value)}
                placeholder="Nhập giá đấu của bạn"
                min={currentBid + 10000}
              />
              <button type="submit">Đặt giá</button>
            </form>

            <div className="bid-history">
              <h4>Lịch sử đấu giá</h4>
              {/* Danh sách lịch sử đấu giá */}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuctionPage;
