import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import SearchBar from '../components/SearchBar';
import CardSection from '../components/CardSection';
import RoomSection from '../components/RoomSection';
import Footer from '../components/Footer';
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


const Home = () => {
  const navigate = useNavigate();
  
  const accommodationTypes = [
    { image: KhachSanImg, title: 'Khách sạn' },
    { image: CanHoImg, title: 'Căn hộ' },
    { image: HomestayImg, title: 'Homestay' },
    { image: ResortImg, title: 'Resort' },
    { image: BietThuImg, title: 'Biệt thự' },
  ];

  const destinations = [
    { image: HoChiMinhImg, title: 'TP. Hồ Chí Minh' },
    { image: HaNoiImg, title: 'Hà Nội' },
    { image: VungTauImg, title: 'Vũng Tàu' },
    { image: DaLatImg, title: 'Đà Lạt' },
    { image: NhaTrangImg, title: 'Nha Trang' },
  ];

  return (
    <>
      <div className="home-banner">
        <img src={HomeBackground} alt="Home Banner" className="banner-image" />
        
        <div className="banner-header">
          <div className="home-logo">
            <img src={logo} alt="Logo" className="home-logo-image" />
            <span className="home-logo-text">bidstay</span>
          </div>

          <div className="login-signup">
            <button className='home-login-button' onClick={() => navigate('/login')}>Đăng nhập</button>
            <button className='home-signup-button' onClick={() => navigate('/signup')}>Đăng ký</button>
          </div>
        </div>

        <div className="banner-content">
          <p className="banner-subtitle">Đồng hành cùng chuyến đi của bạn</p>
          <h1 className="banner-title">Ở THOẢI MÁI - ĐI THẬT XA</h1>
          <p className="banner-subtitle">Ưu đãi linh hoạt cho mọi hành trình</p>
        </div>
      </div>
      <SearchBar />
      <CardSection title="Tìm theo loại chỗ nghỉ" items={accommodationTypes} />
      <CardSection title="Điểm đến nổi bật tại Việt Nam" items={destinations} />
      <RoomSection title="Nơi lưu trú được ưa chuộng tại Hà Nội" provinceCode="01" limit={15} />
      <RoomSection title="Chỗ ở còn phòng tại Phú Quốc" provinceCode="91" limit={15} />
      <RoomSection title="Khám phá nơi lưu trú tại Hà Giang" provinceCode="02" limit={15} />
      <Footer />
    </>
  );
};

export default Home;