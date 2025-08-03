import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <Header />
      <main className="home-content">
        <section className="hero-section">
          <h1>Đấu giá phòng trọ trực tuyến</h1>
          <p>Tìm kiếm và đấu giá phòng trọ phù hợp với nhu cầu của bạn</p>
          <button className="cta-button">Bắt đầu tìm kiếm</button>
        </section>
        
        <section className="featured-rooms">
          <h2>Phòng nổi bật</h2>
          <div className="rooms-grid">
            {/* Danh sách phòng nổi bật */}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
