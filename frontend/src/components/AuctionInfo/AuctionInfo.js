import React from 'react';
import './AuctionInfo.css';
import DownIcon from '../../assets/down.png';

const AuctionInfo = ({ details }) => {
    return (
        <div className="auction-details-section">
            <div className='auction-details-section-title'>
                <img src={DownIcon} alt="Down Icon" className="down-icon" />
                <h4>Chi tiết phiên đấu giá</h4>
            </div>

            <ul>
                <li>Thời gian lưu trú của phiên hiện tại: <strong>{details.stayPeriod}</strong></li>
                <li>Bắt đầu đấu giá: <strong>{details.startTime}</strong></li>
                <li>Kết thúc đấu giá: <strong>{details.endTime}</strong></li>
                <li>Bước nhảy: <strong>{details.bidIncrement.toLocaleString('vi-VN')} đ</strong></li>
                <li>Giá khởi điểm: <strong>{details.startingPrice.toLocaleString('vi-VN')} đ</strong> cho 1 đêm</li>
            </ul>
        </div>
    );
};

export default AuctionInfo;