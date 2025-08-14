import React, { useState } from 'react';
import './BiddingForm.css';

const BiddingForm = ({ currentPrice, bidIncrement }) => {
    const [bidValue, setBidValue] = useState('');

    const suggestedBids = [
        currentPrice + bidIncrement,
        currentPrice + bidIncrement * 2,
        currentPrice + bidIncrement * 3,
        currentPrice + bidIncrement * 4,
    ];

    const handleBidSubmit = () => {
        alert(`Bạn đã đặt giá: ${bidValue || 'vui lòng chọn hoặc nhập giá'}`);
        // Logic xử lý đặt giá sẽ ở đây (gọi API)
    };

    return (
        <div className="bidding-form-card">
            <h4>Đặt giá ngay</h4>
            <div className="current-price-display">
                <p>Giá hiện tại:</p>
                <span>{currentPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="suggested-bids">
                {suggestedBids.map((price, index) => (
                    <button key={index} onClick={() => setBidValue(price)}>
                        {price.toLocaleString('vi-VN')} đ
                    </button>
                ))}
            </div>
            <input
                type="text"
                value={bidValue.toLocaleString('vi-VN')}
                onChange={(e) => setBidValue(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Nhập giá của bạn"
                className="bid-input"
            />
            <button className="submit-bid-button" onClick={handleBidSubmit}>
                Đặt giá
            </button>
        </div>
    );
};

export default BiddingForm;