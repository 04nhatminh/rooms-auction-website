import React from 'react';
// import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CardSection from '../components/CardSection';
import Footer from '../components/Footer';
import HomeBackground from '../assets/home_background.jpg';
import logo from '../assets/logo.png';
import './Home.css';

// Import ảnh từ thư mục assets
// Ví dụ: import bannerImg from '../assets/banner.jpg';
// Bạn cần tự thêm các ảnh vào thư mục assets

const Home = () => {
  // Dữ liệu mẫu - Trong ứng dụng thực tế, dữ liệu này sẽ được lấy từ API
  const accommodationTypes = [
    { image: '/path/to/khachsan.jpg', title: 'Khách sạn' },
    { image: '/path/to/canho.jpg', title: 'Căn hộ' },
    { image: '/path/to/homestay.jpg', title: 'Homestay' },
    { image: '/path/to/resort.jpg', title: 'Resort' },
    { image: '/path/to/bietthu.jpg', title: 'Biệt thự' },
  ];

  const destinations = [
    { image: '/path/to/hcmc.jpg', title: 'TP. Hồ Chí Minh' },
    { image: '/path/to/hanoi.jpg', title: 'Hà Nội' },
    { image: '/path/to/vungtau.jpg', title: 'Vũng Tàu' },
    { image: '/path/to/dalat.jpg', title: 'Đà Lạt' },
    { image: '/path/to/nhatrang.jpg', title: 'Nha Trang' },
  ];
  
  // Tương tự, tạo dữ liệu cho các section khác...

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
            <button className='home-login-button'>Đăng nhập</button>
            <button className='home-signup-button'>Đăng ký</button>
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
      {/* Thêm các section đấu giá và nơi lưu trú ở đây */}

      <Footer />
    </>
  );
};

export default Home;