import React, { useState, useEffect } from 'react';
import './AuctionInfo.css';

const AuctionInfo = ({ details }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(details.endDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const formatTime = (time) => String(time).padStart(2, '0');

    return (
        <div className="auction-info-card">
            <div className="countdown-timer">
                <p>Thời gian còn lại</p>
                <span>{formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}</span>
            </div>
            <div className="details-section">
                <h4>Chi tiết phiên đấu giá</h4>
                <ul>
                    <li><strong>Thời gian lưu trú áp dụng:</strong> {details.stayPeriod}</li>
                    <li><strong>Bắt đầu đấu giá:</strong> {details.startTime}</li>
                    <li><strong>Kết thúc đấu giá:</strong> {details.endTime}</li>
                    <li><strong>Thời lượng đấu giá:</strong> {details.duration}</li>
                    <li><strong>Bước nhảy:</strong> {details.bidIncrement.toLocaleString('vi-VN')} đ</li>
                    <li><strong>Giá khởi điểm:</strong> {details.startingPrice.toLocaleString('vi-VN')} đ cho 1 đêm</li>
                </ul>
            </div>
        </div>
    );
};

export default AuctionInfo;