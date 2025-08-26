import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuctionCard.css';
import LocationIcon from '../../assets/location.png';
import StarOutlineIcon from '../../assets/star_outline.png';
import PriceTagIcon from '../../assets/price.png';
import PlaceHolderImg from '../../assets/placeholder.jpg';

const AuctionCard = ({ auction }) => {
  const navigate = useNavigate();
  const defaultImage = PlaceHolderImg;
  const [timeLeft, setTimeLeft] = useState(null);

  // Tính thời gian còn lại
  useEffect(() => {
    if (!auction?.EndTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.EndTime).getTime();
      const difference = endTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, total: difference });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [auction?.EndTime]);

  // Padding thêm số 0 nếu < 10
  const padZero = (num) => (num < 10 ? `0${num}` : num);

  // Format countdown text
  const formatCountdown = () => {
    if (!timeLeft) return '';
    
    if (timeLeft.total <= 0) {
      return 'Đã kết thúc';
    }

    if (timeLeft.days > 0) {
      return `${timeLeft.days} ngày ${padZero(timeLeft.hours)}:${padZero(timeLeft.minutes)}:${padZero(timeLeft.seconds)}`;
    } else if (timeLeft.hours > 0) {
      return `${padZero(timeLeft.hours)}:${padZero(timeLeft.minutes)}:${padZero(timeLeft.seconds)}`;
    } else {
      return `${padZero(timeLeft.minutes)}:${padZero(timeLeft.seconds)}`;
    }
  };

  // Format giá tiền
  const formatPrice = (price, currency = 'VND') => {
    if (!price) return 'Liên hệ';
    
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    }
    
    return `${price} ${currency}`;
  };

  // Xác định loại auction từ PropertyName
  const getProductType = (propertyName) => {
    if (!propertyName) return 'Chỗ nghỉ';
    
    const lowerName = propertyName.toLowerCase();
    
    // Tìm từ trái qua phải, keyword nào có trước thì lấy
    if (lowerName.includes('phòng')) return 'Phòng';
    if (lowerName.includes('nhà')) return 'Nhà';
    if (lowerName.includes('căn hộ')) return 'Căn hộ';
    if (lowerName.includes('biệt thự')) return 'Biệt thự';
    
    return 'Chỗ nghỉ'; // fallback
  };

  // Format tên hiển thị
  const getRoomDisplayName = (auction) => {
    if (!auction) return 'Tên phòng không có';
    
    const auctionType = getProductType(auction.PropertyName);
    const location = auction.DistrictName || auction.ProvinceName || 'địa điểm không xác định';
    
    return `${auctionType} tại ${location}`;
  };

  // Xử lý sự kiện click vào card
  const handleCardClick = () => {
    if (auction) {
      const auctionId = auction.AuctionUID;
      if (auctionId) {
        navigate(`/auction/${auctionId}`);
        window.scrollTo(0, 0);
      }
    }
  };

  return (
    <div className="auction-card" onClick={handleCardClick}>
      <div className="auction-card-image-container">
        <img 
          src={
            auction?.mongoImageUrl || 
            auction?.PropertyImageURL || 
            auction?.RoomTypeImageURL || 
            defaultImage
          } 
          alt={auction?.ProductName || 'Room'} 
          className="auction-card-image"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        
        <div className="auction-countdown-overlay">
          <div className="bid-count-section">
            <span className='bid-count-text'>{auction?.BidCount || 0} lượt đấu giá</span>
          </div>
          <div className="countdown-section">
            <span className='countdown-text'>{formatCountdown()}</span>
          </div>
        </div>
      </div>

      <div className="auction-info">
        <h3 className="auction-name">
          {getRoomDisplayName(auction)}
        </h3>

        <p className="auction-address">
          <img src={LocationIcon} alt="Location" />
          <span>{auction?.DistrictName}, {auction?.ProvinceName || 'Việt Nam'}</span>
        </p>

        <div className="auction-rating">
          <img src={StarOutlineIcon} alt="Star Rating" />
          <span className="rating-text">
            {auction?.AverageRating?.toFixed(1)} - {auction.totalReviews} đánh giá
          </span>
        </div>

        <p className="auction-price">
          <img src={PriceTagIcon} alt="Price" />
          <span className='price-title'>Giá khởi điểm:</span>
          <span className="price-amount">&nbsp;{formatPrice(auction?.StartPrice)}</span>
        </p>

        <p className="auction-price">
          <img src={PriceTagIcon} alt="Price" />
          <span className='price-title'>Giá hiện tại:</span>
          <span className="price-amount">&nbsp;{formatPrice(auction?.CurrentPrice)}</span>
        </p>

      </div>
    </div>
  );
};

export default AuctionCard;