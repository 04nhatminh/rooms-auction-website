import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import SearchBar from '../components/SearchBar';
import CardSection from '../components/CardSection';
import RoomSection from '../components/RoomSection';
import Footer from '../components/Footer';
import { useLocation } from '../contexts/LocationContext';
import logo from '../assets/logo.png';
import HomeBackground from '../assets/home_background.jpg';
import KhachSanImg from '../assets/khach_san.png';
import CanHoImg from '../assets/can_ho.jpg';
import HomestayImg from '../assets/homestay.jpg';
import ResortImg from '../assets/resort.jpg';
import BietThuImg from '../assets/biet_thu.jpg';
import HoChiMinhImg from '../assets/ho_chi_minh.jpg';
import HaNoiImg from '../assets/ha_noi.png';
import VungTauImg from '../assets/vung_tau.jpg';
import DaLatImg from '../assets/da_lat.jpg';
import NhaTrangImg from '../assets/nha_trang.jpg';
import UserMenu from '../components/UserMenu';


const HomePage = () => {
  const { popularLocations, isLoading: isLoadingLocations, error: locationError, getPopularLocations } = useLocation();
  
  // Load popular locations khi component mount (chỉ khi chưa có data)
  useEffect(() => {
    if (popularLocations.length === 0 && !isLoadingLocations) {
      console.log('HomePage: Loading popular locations...');
      getPopularLocations(5);
    } else if (popularLocations.length > 0) {
      console.log('HomePage: Popular locations already available:', popularLocations.length);
    }
  }, []);
  
  const accommodationTypes = useMemo(() => [
    { image: KhachSanImg, title: 'Khách sạn' },
    { image: CanHoImg, title: 'Căn hộ' },
    { image: HomestayImg, title: 'Homestay' },
    { image: ResortImg, title: 'Resort' },
    { image: BietThuImg, title: 'Biệt thự' },
  ], []);

  const destinations = useMemo(() => [
    { image: HoChiMinhImg, title: 'TP. Hồ Chí Minh' },
    { image: HaNoiImg, title: 'Hà Nội' },
    { image: VungTauImg, title: 'Vũng Tàu' },
    { image: DaLatImg, title: 'Đà Lạt' },
    { image: NhaTrangImg, title: 'Nha Trang' },
  ], []);

  // Memoize các props cho RoomSection để tránh tạo object mới mỗi lần render
  const roomSectionConfigs = useMemo(() => [
    { title: "Nơi lưu trú được ưa chuộng tại Hà Nội", provinceCode: "01", limit: 15 },
    { title: "Chỗ ở còn phòng tại Vũng Tàu", provinceCode: "77", limit: 15 },
    { title: "Khám phá nơi lưu trú tại Sa Pa", provinceCode: "10", limit: 15 }
  ], []);

  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) setUser(JSON.parse(stored));
    } catch (_) {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <>
      {isLoadingLocations}
      <div className="home-banner">
        <img src={HomeBackground} alt="Home Banner" className="banner-image" />
        
        <div className="banner-header">
          <div className="home-logo">
            <img src={logo} alt="Logo" className="home-logo-image" />
            <span className="home-logo-text">bidstay</span>
          </div>

          {/* Thay thế cụm nút Login/Signup bằng menu người dùng */}
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <div className="login-signup">
              <button className='home-login-button' onClick={() => navigate('/login')}>Đăng nhập</button>
              <button className='home-signup-button' onClick={() => navigate('/signup')}>Đăng ký</button>
            </div>
          )}
        </div>

        <div className="banner-content">
          <p className="banner-subtitle">Đồng hành cùng chuyến đi của bạn</p>
          <h1 className="banner-title">Ở THOẢI MÁI - ĐI THẬT XA</h1>
          <p className="banner-subtitle">Ưu đãi linh hoạt cho mọi hành trình</p>
        </div>
      </div>
      <SearchBar popularLocations={popularLocations} />
      <CardSection title="Tìm theo loại chỗ nghỉ" items={accommodationTypes} />
      <CardSection title="Điểm đến nổi bật tại Việt Nam" items={destinations} />
      {roomSectionConfigs.map((config, index) => (
        <RoomSection 
          key={`${config.provinceCode}-${config.limit}`}
          title={config.title}
          provinceCode={config.provinceCode}
          limit={config.limit}
        />
      ))}
      <Footer />
    </>
  );
};

export default HomePage;