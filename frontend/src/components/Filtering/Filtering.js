import React, { useState, useEffect } from 'react';
import './Filtering.css';

const Filtering = ({ type = 'room', onFiltersChange }) => {
  const [filters, setFilters] = useState({
    popularity: 'popular',
    sortBy: '',
    priceRange: { min: 0, max: 10000000 },
    accommodationTypes: [],
    rating: '',
    auctionTypes: ''
  });

  // Gọi onFiltersChange với giá trị mặc định khi component mount
  useEffect(() => {
    onFiltersChange?.(filters);
  }, []);

  const handlePopularityChange = (value) => {
    const newFilters = { ...filters, popularity: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleSortChange = (value) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handlePriceRangeChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    let newPriceRange = { ...filters.priceRange };
    
    if (field === 'min') {
      newPriceRange.min = Math.min(numValue, filters.priceRange.max);
    } else {
      newPriceRange.max = Math.max(numValue, filters.priceRange.min);
    }
    
    const newFilters = {
      ...filters,
      priceRange: newPriceRange
    };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Format số thành tiền tệ VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Tính toán vị trí và độ rộng của vùng được chọn
  const getSelectedRangeStyle = () => {
    const minPercent = (filters.priceRange.min / 10000000) * 100;
    const maxPercent = (filters.priceRange.max / 10000000) * 100;
    
    return {
      left: `${minPercent}%`,
      width: `${maxPercent - minPercent}%`
    };
  };

  const handleAccommodationTypeChange = (value, checked) => {
    const newTypes = checked
      ? [...filters.accommodationTypes, value]
      : filters.accommodationTypes.filter(type => type !== value);
    
    const newFilters = { ...filters, accommodationTypes: newTypes };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleRatingChange = (value) => {
    const newFilters = { ...filters, rating: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleAuctionTypeChange = (value) => {
    const newFilters = { ...filters, auctionTypes: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  return (
    <div className="filtering-container">
      {/* Độ phổ biến */}
      <div className="filter-section">
        <h3>Độ phổ biến</h3>
        <div className="radio-button-group">
          {[
            { value: 'popular', label: 'Phổ biến nhất' },
            { value: 'newest', label: 'Mới nhất' },
          ].map(({ value, label }) => (
            <label key={value} className="radio-button-label">
              <input
                type="radio"
                name="popularity"
                checked={filters.popularity === value}
                onChange={() => handlePopularityChange(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Sắp xếp */}
      <div className="filter-section">
        <h3>Sắp xếp</h3>
        <div className="radio-button-group">
          {[
            { value: 'priceAsc', label: 'Giá tăng dần' },
            { value: 'priceDesc', label: 'Giá giảm dần' }
          ].map(({ value, label }) => (
            <label key={value} className="radio-button-label">
              <input
                type="radio"
                name="sortBy"
                checked={filters.sortBy === value}
                onChange={() => handleSortChange(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Lọc theo khoảng giá */}
      <div className="filter-section">
        <h3>Khoảng giá</h3>
        <div className="price-range-slider">
          <div className="price-display">
            <span>{formatPrice(filters.priceRange.min)}</span>
            <span>-</span>
            <span>{formatPrice(filters.priceRange.max)}</span>
          </div>
          <div className="slider-container">
            <div className="selected-range" style={getSelectedRangeStyle()}></div>
            <input
              type="range"
              min="0"
              max="10000000"
              step="100000"
              value={filters.priceRange.min}
              onChange={(e) => handlePriceRangeChange('min', e.target.value)}
              className="slider slider-min"
            />
            <input
              type="range"
              min="0"
              max="10000000"
              step="100000"
              value={filters.priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', e.target.value)}
              className="slider slider-max"
            />
          </div>
        </div>
      </div>

      {/* Loại đấu giá (chỉ hiện khi type === 'auction') */}
      {type === 'auction' && (
        <div className="filter-section">
          <h3>Loại đấu giá</h3>
          <div className="radio-button-group">
            {[
              { value: 'endingSoon', label: 'Sắp kết thúc' },
              { value: 'featured', label: 'Nổi bật nhất' },
              { value: 'newest', label: 'Mới nhất' }
            ].map(({ value, label }) => (
              <label key={value} className="radio-button-label">
                <input
                  type="radio"
                  name="auctionTypes"
                  checked={filters.auctionTypes === value}
                  onChange={() => handleAuctionTypeChange(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Loại chỗ ở */}
      <div className="filter-section">
        <h3>Loại chỗ ở</h3>
        <div className="checkbox-group">
          {[              
            { value: '1', label: 'Khách sạn' },
            { value: '2', label: 'Căn hộ' },
            { value: '3', label: 'Homestay' },
            { value: '4', label: 'Resort' },
            { value: '5', label: 'Biệt thự' },
            { value: '6', label: 'Studio' },
            { value: '7', label: 'Nhà nghỉ' }
            ].map(({ value, label }) => (
              <label key={value} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.accommodationTypes.includes(value)}
                  onChange={(e) => handleAccommodationTypeChange(value, e.target.checked)}
                />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Điểm đánh giá */}
      <div className="filter-section">
        <h3>Điểm đánh giá</h3>
        <div className="rating-buttons">
          {[
            // { value: '', label: 'Tất cả' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' }
          ].map(({ value, label }) => (
            <button
              key={value}
              className={`rating-button ${filters.rating === value ? 'active' : ''}`}
              onClick={() => handleRatingChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Filtering;
