import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext';
import { useUser } from '../../contexts/UserContext';
import SearchBar from '../../components/SearchBar/SearchBar';
import CardSection from '../../components/CardSection/CardSection';
import RoomSection from '../../components/RoomSection/RoomSection';
import SignInUpAction from '../../components/SignInUpAction/SignInUpAction';
import HeaderUserMenu from '../../components/HeaderUserMenu/HeaderUserMenu';
import Footer from '../../components/Footer/Footer';
import logo from '../../assets/logo.png';
import HomeBackground from '../../assets/home_background.jpg';
import KhachSanImg from '../../assets/khach_san.png';
import CanHoImg from '../../assets/can_ho.jpg';
import HomestayImg from '../../assets/homestay.jpg';
import ResortImg from '../../assets/resort.jpg';
import BietThuImg from '../../assets/biet_thu.jpg';
import HoChiMinhImg from '../../assets/ho_chi_minh.jpg';
import HaNoiImg from '../../assets/ha_noi.png';
import VungTauImg from '../../assets/vung_tau.jpg';
import DaLatImg from '../../assets/da_lat.jpg';
import NhaTrangImg from '../../assets/nha_trang.jpg';
import WishlistBox from '../../components/WishlistBox/WishlistBox';
import './HomePage.css';


const HomePage = () => {
  const { popularLocations, isLoading: isLoadingLocations, error: locationError, getPopularLocations } = useLocation();
  const { user, isAuthenticated } = useUser();
  const navigate = useNavigate();
  
  // Load popular locations khi component mount (chỉ khi chưa có data)
  useEffect(() => {
    if (popularLocations.length === 0 && !isLoadingLocations) {
      console.log('HomePage: Loading popular locations...');
      getPopularLocations(5);
    } else if (popularLocations.length > 0) {
      console.log('HomePage: Popular locations already available:', popularLocations.length);
    }
  }, []);

  // Handler for accommodation type click
  const handleAccommodationTypeClick = (item) => {
    if (item.roomTypeId) {
      // Navigate đến trang search với filter roomType
      const searchParams = new URLSearchParams({
        accommodationTypes: item.roomTypeId
      });
      navigate(`/search?${searchParams.toString()}`);
      window.scrollTo(0, 0);
    }
  };

  // Handler for destination click
  const handleDestinationClick = (item) => {
    if (item.provinceCode) {
      // Navigate đến trang search với location
      const searchParams = new URLSearchParams({
        location: item.title,
        locationId: item.provinceCode,
        type: 'province'
      });
      navigate(`/search?${searchParams.toString()}`);
      window.scrollTo(0, 0);
    }
  };
  
  const accommodationTypes = useMemo(() => [
    { image: KhachSanImg, title: 'Khách sạn', roomTypeId: '1' },
    { image: CanHoImg, title: 'Căn hộ', roomTypeId: '2' },
    { image: HomestayImg, title: 'Homestay', roomTypeId: '3' },
    { image: ResortImg, title: 'Resort', roomTypeId: '4' },
    { image: BietThuImg, title: 'Biệt thự', roomTypeId: '5' },
  ], []);

  const destinations = useMemo(() => [
    { image: HoChiMinhImg, title: 'Hồ Chí Minh', provinceCode: '79' },
    { image: HaNoiImg, title: 'Hà Nội', provinceCode: '01' },
    { image: VungTauImg, title: 'Vũng Tàu', provinceCode: '77' },
    { image: DaLatImg, title: 'Đà Lạt', provinceCode: '68' },
    { image: NhaTrangImg, title: 'Nha Trang', provinceCode: '56' },
  ], []);

  // Memoize các props cho RoomSection để tránh tạo object mới mỗi lần render
  const roomSectionConfigs = useMemo(() => [
    { title: "Nơi lưu trú được ưa chuộng tại Hà Nội", provinceCode: "01", limit: 15 },
    { title: "Chỗ ở còn phòng tại Đà Lạt", provinceCode: "68", limit: 15 },
    { title: "Khám phá nơi lưu trú tại Đà Nẵng", provinceCode: "48", limit: 15 }
  ], []);

  return (
    <div className="homepage-wrapper">
      {isLoadingLocations}
      <div className="home-banner">
        <img src={HomeBackground} alt="Home Banner" className="banner-image" />
        
        <div className="banner-header">
          <div className="home-logo">
            <img src={logo} alt="Logo" className="home-logo-image" />
            <span className="home-logo-text">bidstay</span>
          </div>

          {isAuthenticated() ? (
            <HeaderUserMenu />
          ) : (
            <SignInUpAction type="home" />
          )}
        </div>

        <div className="banner-content">
          <p className="banner-subtitle">Đồng hành cùng chuyến đi của bạn</p>
          <h1 className="banner-title">Ở THOẢI MÁI - ĐI THẬT XA</h1>
          <p className="banner-subtitle">Ưu đãi linh hoạt cho mọi hành trình</p>
        </div>
      </div>
      <SearchBar />
      
      <div className='home-content'>
        <CardSection 
          title="Tìm theo loại chỗ nghỉ" 
          items={accommodationTypes} 
          onItemClick={handleAccommodationTypeClick}
        />
        <CardSection 
          title="Điểm đến nổi bật tại Việt Nam" 
          items={destinations} 
          onItemClick={handleDestinationClick}
        />
        {roomSectionConfigs.map((config, index) => (
          <RoomSection 
            key={`${config.provinceCode}-${config.limit}`}
            title={config.title}
            provinceCode={config.provinceCode}
            limit={config.limit}
          />
        ))}
      </div>
      <WishlistBox />
      <Footer />
    </div>
  );
};

export default HomePage;