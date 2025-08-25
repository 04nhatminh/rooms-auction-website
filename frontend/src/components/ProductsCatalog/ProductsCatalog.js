import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductsCatalog.css';

// Import images for accommodation types
import KhachSanImg from '../../assets/khach_san.png';
import CanHoImg from '../../assets/can_ho.jpg';
import HomestayImg from '../../assets/homestay.jpg';
import ResortImg from '../../assets/resort.jpg';
import BietThuImg from '../../assets/biet_thu.jpg';
import StudioImg from '../../assets/studio.jpg';

const ProductsCatalog = () => {
  const navigate = useNavigate();
  
  const [selectedAccommodationType, setSelectedAccommodationType] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock popular locations data (sẽ thay thế bằng real API data sau)
  const popularLocations = useMemo(() => [
    { 
      name: 'Hồ Chí Minh', 
      code: '79', 
      type: 'province',
      displayText: 'Hồ Chí Minh'
    },
    { 
      name: 'Hà Nội', 
      code: '01', 
      type: 'province',
      displayText: 'Hà Nội'
    },
    { 
      name: 'Đà Nẵng', 
      code: '48', 
      type: 'province',
      displayText: 'Đà Nẵng'
    },
    { 
      name: 'Hải Phòng', 
      code: '31', 
      type: 'province',
      displayText: 'Hải Phòng'
    },
    { 
      name: 'Cần Thơ', 
      code: '92', 
      type: 'province',
      displayText: 'Cần Thơ'
    },
    { 
      name: 'Đà Lạt', 
      code: '68', 
      type: 'province',
      displayText: 'Đà Lạt'
    },
    { 
      name: 'Nha Trang', 
      code: '56', 
      type: 'province',
      displayText: 'Nha Trang'
    },
    { 
      name: 'Vũng Tàu', 
      code: '77', 
      type: 'province',
      displayText: 'Vũng Tàu'
    },
    { 
      name: 'Hạ Long', 
      code: '22', 
      type: 'province',
      displayText: 'Hạ Long'
    },
    { 
      name: 'Phú Quốc', 
      code: '91', 
      type: 'province',
      displayText: 'Phú Quốc'
    }
  ], []);

  // Accommodation types data (Level 1)
  const accommodationTypes = useMemo(() => [
    { 
      id: '1', 
      title: 'Khách sạn', 
      image: KhachSanImg,
      description: 'Dịch vụ chuyên nghiệp, tiện nghi đầy đủ'
    },
    { 
      id: '2', 
      title: 'Căn hộ', 
      image: CanHoImg,
      description: 'Không gian rộng rãi, tiện nghi gia đình'
    },
    { 
      id: '3', 
      title: 'Homestay', 
      image: HomestayImg,
      description: 'Trải nghiệm địa phương, gần gũi'
    },
    {
      id: '6', 
      title: 'Studio', 
      image: StudioImg,
      description: 'Phong cách hiện đại, tối giản'
    },
    { 
      id: '4', 
      title: 'Resort', 
      image: ResortImg,
      description: 'Nghỉ dưỡng cao cấp, view đẹp'
    },
    { 
      id: '5', 
      title: 'Biệt thự', 
      image: BietThuImg,
      description: 'Riêng tư tuyệt đối, xa hoa'
    },
  ], []);

  // Handle accommodation type selection (Level 1)
  const handleAccommodationTypeClick = (accommodationType) => {
    setSelectedAccommodationType(accommodationType);
    setIsDropdownOpen(true);
  };

  // Handle district selection (Level 2) - Navigate to search page
  const handleDistrictClick = (district) => {
    if (!selectedAccommodationType) return;

    const searchParams = new URLSearchParams({
      accommodationTypes: selectedAccommodationType.id,
      location: district.name || district.displayText,
      locationId: district.code,
      type: 'province'
    });

    navigate(`/search?${searchParams.toString()}`);
    setIsDropdownOpen(false);
    setSelectedAccommodationType(null);
  };

  // Close dropdown when clicking outside
  const handleOverlayClick = () => {
    setIsDropdownOpen(false);
    setSelectedAccommodationType(null);
  };

  return (
    <div className="products-catalog">
      <div className="catalog-header">
        <h2>Khám phá theo loại chỗ nghỉ</h2>
        <p>Chọn loại hình lưu trú phù hợp với nhu cầu của bạn</p>
      </div>

      {/* Level 1: Accommodation Types */}
      <div className="accommodation-types-grid">
        {accommodationTypes.map((type) => (
          <div
            key={type.id}
            className="accommodation-type-card"
            onClick={() => handleAccommodationTypeClick(type)}
          >
            <div className="accommodation-image">
              <img src={type.image} alt={type.title} />
              <div className="accommodation-overlay">
                <span className="accommodation-title">{type.title}</span>
                <span className="accommodation-description">{type.description}</span>
                <div className="view-more-btn">Xem các khu vực</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Level 2: Popular Districts Dropdown */}
      {isDropdownOpen && selectedAccommodationType && (
        <div className="districts-dropdown-overlay" onClick={handleOverlayClick}>
          <div className="districts-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-header">
              <h3>{selectedAccommodationType.title} tại các khu vực phổ biến</h3>
              <button 
                className="close-dropdown"
                onClick={handleOverlayClick}
              >
                ×
              </button>
            </div>
            
            <div className="districts-grid">
              {popularLocations.map((district, index) => (
                <div
                  key={district.code || index}
                  className="district-card"
                  onClick={() => handleDistrictClick(district)}
                >
                  <div className="district-info">
                    <h4>{district.name || district.displayText}</h4>
                    <p>Khám phá {selectedAccommodationType.title.toLowerCase()} tại đây</p>
                  </div>
                  <div className="district-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsCatalog;
