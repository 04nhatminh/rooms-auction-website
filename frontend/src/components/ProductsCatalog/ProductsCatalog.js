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
import HoChiMinhImg from '../../assets/ho_chi_minh.jpg';
import HaNoiImg from '../../assets/ha_noi.png';
import VungTauImg from '../../assets/vung_tau.jpg';
import DaLatImg from '../../assets/da_lat.jpg';
import NhaTrangImg from '../../assets/nha_trang.jpg';
import PhuYenImg from '../../assets/phu_yen.jpg';
import DaNangImg from '../../assets/da_nang.jpg';
import HueImg from '../../assets/hue.jpg';
import HaLongImg from '../../assets/ha_long.jpg';
import HaiPhongImg from '../../assets/hai_phong.jpg';

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
      image: HoChiMinhImg,
      description: 'Trung tâm kinh tế, văn hóa',
      displayText: 'Hồ Chí Minh'
    },
    { 
      name: 'Hà Nội', 
      code: '01', 
      image: HaNoiImg,
      type: 'province',
      description: 'Thủ đô ngàn năm văn hiến',
      displayText: 'Hà Nội'
    },
    { 
      name: 'Đà Nẵng', 
      code: '48', 
      type: 'province',
      image: DaNangImg,
      description: 'Thành phố đáng sống',
      displayText: 'Đà Nẵng'
    },
    { 
      name: 'Hải Phòng', 
      code: '31', 
      image: HaiPhongImg,
      type: 'province',
      description: 'Thành phố cảng sôi động',
      displayText: 'Hải Phòng'
    },
    { 
      name: 'Huế', 
      code: '46', 
      type: 'province',
      image: HueImg,
      description: 'Cố đô lịch sử',
      displayText: 'Huế'
    },
    { 
      name: 'Đà Lạt', 
      code: '68', 
      type: 'province',
      image: DaLatImg,
      description: 'Thành phố ngàn hoa',
      displayText: 'Đà Lạt'
    },
    { 
      name: 'Phú Yên', 
      code: '54', 
      type: 'province',
      image: PhuYenImg,
      description: 'Vùng đất nắng gió, biển xanh cát trắng',
      displayText: 'Phú Yên'
    },
    { 
      name: 'Nha Trang', 
      code: '56', 
      type: 'province',
      image: NhaTrangImg,
      description: 'Thành phố biển xinh đẹp',
      displayText: 'Nha Trang'
    },
    { 
      name: 'Vũng Tàu', 
      code: '77', 
      image: VungTauImg,
      type: 'province',
      description: 'Thành phố biển nổi tiếng',
      displayText: 'Vũng Tàu'
    },
    { 
      name: 'Hạ Long', 
      code: '22', 
      type: 'province',
      image: HaLongImg,
      description: 'Kỳ quan thiên nhiên thế giới',
      displayText: 'Hạ Long'
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
    window.scrollTo(0, 0);
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
                <button className="close-dropdown" onClick={handleOverlayClick}>×</button>
                <h3>{selectedAccommodationType.title} tại các khu vực phổ biến</h3>
            </div>

            <div className="location-types-grid">
                {popularLocations.map((district, index) => (
                <div
                    key={district.code || index}
                    className="location-type-card"
                    onClick={() => handleDistrictClick(district)}
                >
                    <div className="location-image">
                        <img src={district.image} alt={district.name || district.displayText} />
                        <div className="location-overlay">
                            <div className="location-meta">
                                <span className="location-title">{district.name || district.displayText}</span>
                                <span className="location-description">{district.description}</span>
                            </div>
                            <div className="district-arrow">→</div>
                        </div>
                    </div>
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
