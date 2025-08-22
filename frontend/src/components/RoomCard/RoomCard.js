import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoomCard.css';
import LocationIcon from '../../assets/location.png';
import StarOutlineIcon from '../../assets/star_outline.png';
import PriceTagIcon from '../../assets/price.png';
import PlaceHolderImg from '../../assets/placeholder.jpg';
import favoriteIcon from '../../assets/favorite.png';
import favoriteFilledIcon from '../../assets/favorite_filled.png';
import FavoritesApi from '../../api/favoritesApi';

const RoomCard = ({ product, durationDays = 1, isFavorite: initialIsFavorite = false }) => {
  const navigate = useNavigate();
  const defaultImage = PlaceHolderImg;
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

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

  // Xác định loại product từ PropertyName
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
  const getRoomDisplayName = (product) => {
    if (!product) return 'Tên phòng không có';
    
    const productType = getProductType(product.PropertyName);
    const location = product.DistrictName || product.ProvinceName || 'địa điểm không xác định';
    
    return `${productType} tại ${location}`;
  };

  // Xử lý sự kiện click vào card
  const handleCardClick = () => {
    if (product) {
      const roomId = product.UID;
      if (roomId) {
        navigate(`/room/${roomId}`);
      }
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (loadingFavorite) return;
    if (!product?.UID) {
      alert('Không xác định được phòng để yêu thích!');
      setLoadingFavorite(false);
      return;
    }
    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        await FavoritesApi.removeFavorite(product.UID);
        setIsFavorite(false);
      } else {
        await FavoritesApi.addFavorite(product.UID);
        setIsFavorite(true);
      }
    } catch (err) {
      alert('Có lỗi khi cập nhật yêu thích: ' + (err.message || ''));
    } finally {
      setLoadingFavorite(false);
    }
  };

  return (
    <div className="room-card" onClick={handleCardClick}>
      <div className="room-card-image-container" style={{ position: 'relative' }}>
        <img
          src={
            product?.mongoImageUrl || 
            product?.PropertyImageURL || 
            product?.RoomTypeImageURL || 
            defaultImage
          } 
          alt={product?.ProductName || 'Room'} 
          className="room-card-image"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        <button
          className="favorite-btn"
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}
          onClick={handleToggleFavorite}
          disabled={loadingFavorite}
          aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <img
            src={isFavorite ? favoriteFilledIcon : favoriteIcon}
            alt={isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
            style={{ width: 28, height: 28 }}
          />
        </button>
      </div>

      <div className="room-info">
        <h3 className="room-name">
          {getRoomDisplayName(product)}
        </h3>

        <p className="room-address">
          <img src={LocationIcon} alt="Location" />
          <span>{product?.DistrictName}, {product?.ProvinceName || 'Việt Nam'}</span>
        </p>

        <div className="room-rating">
          <img src={StarOutlineIcon} alt="Star Rating" />
          <span className="rating-text">
            {(product?.avgRating || product?.AverageRating || 0)?.toFixed(1)} - {product.totalReviews} đánh giá
          </span>
        </div>

        <p className="room-price">
          <img src={PriceTagIcon} alt="Price" />
          <span className="price-amount">{formatPrice(product?.Price * durationDays)}</span>
          <span className="price-period">&nbsp;cho {durationDays} đêm</span>
        </p>

      </div>
    </div>
  );
};

export default RoomCard;