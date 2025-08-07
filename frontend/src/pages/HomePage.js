import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [searchForm, setSearchForm] = useState({
    location: '',
    checkin: '',
    checkout: '',
    guests: 1
  });

  // Check if user is logged in on page load
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
    getAllProducts();
  }, []);

  const updateAuthUI = (userData) => {
    setUserData(userData);
  };

  const logout = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));

    cleanupAfterLogout();

    // Nếu user đăng nhập bằng Google thì revoke
    if (!userData?.hashPassword) {
      if (typeof window.google !== 'undefined' && window.google.accounts?.id?.revoke) {
        window.google.accounts.id.revoke(userData.email, () => {
          console.log('✅ Đã logout khỏi Google');
        });
      } else {
        console.warn('⚠️ Google API chưa sẵn sàng, thực hiện logout thông thường');
      }
    }
  };

  const cleanupAfterLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setUserData(null);
    navigate('/'); // hoặc reload lại nếu cần
  };

  const getAllProducts = async () => {
    // Implementation from original HTML
    const API_BASE_URL = 'http://localhost:3000/demo';
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();

      if (data.success) {
        console.log('Products loaded:', data.data);
        // Handle product display here
      } else {
        console.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search form submitted:', searchForm);
    // Implement search logic here
  };

  const toggleHeart = (element) => {
    const icon = element.querySelector('i');
    if (icon.classList.contains('bi-heart')) {
      icon.classList.remove('bi-heart');
      icon.classList.add('bi-heart-fill');
    } else {
      icon.classList.remove('bi-heart-fill');
      icon.classList.add('bi-heart');
    }
  };

  const scrollDestinations = (direction, listId) => {
    const container = document.getElementById(listId);
    const scrollAmount = direction * 260; // Card width
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="position-relative">
        <div id="header" className="roundered floating-header bg-gray p-3 shadow-sm d-flex justify-content-between"
             style={{
               backgroundImage: "url('./images/photo banner.png')",
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               borderRadius: '20px',
               transition: 'background-image 0.3s ease'
             }}>
          {/* LOGO + NAME */}
          <div className="d-flex align-items-start mt-3 mt-md-3 ms-3">
            <a href="/" className="d-flex align-items-center text-decoration-none">
              <img src="./images/a2airbnb 2.png" alt="Logo" width="40" height="35" className="me-2"/>
              <h1 className="mb-0 logo-text">airbnb</h1>
            </a>
          </div>
          
          {/* LOGIN + SIGNUP */}
          {!userData && (
            <div className="auth-buttons" id="authButtons">
              <button 
                onClick={() => navigate('/login')} 
                className="me-3 text-decoration-none log-in-text"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Đăng nhập
              </button>
              <button className="btn btn btn-light btn-lg" 
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        color: 'black',
                        fontSize: '14px',
                        margin: '12px'
                      }}
                      onClick={() => navigate('/signup')}>
                Đăng ký
              </button>
            </div>
          )}

          {/* User info */}
          {userData && (
            <div className="dropdown user-info" id="userInfo">
              <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" id="welcomeText">
                Chào {userData.name}!
              </button>
              <ul className="dropdown-menu dropdown-menu-end custom-dropdown">
                <li><button className="dropdown-item" type="button"><i className="fa-regular fa-heart me-2"></i>Danh sách yêu thích</button></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-gavel me-2"></i>Lịch sử đấu giá</button></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-clock-rotate-left me-2"></i>Lịch sử mua hàng/thanh toán</button></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-user me-2"></i> Hồ sơ</button></li>
                <li><hr className="dropdown-divider"/></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-bell me-2"></i>Thông báo</button></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-gear me-2"></i>Cài đặt tài khoản</button></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-language me-2"></i>Ngôn ngữ & Tiền tệ</button></li>
                <li><button className="dropdown-item" type="button"><i className="fa-solid fa-circle-info me-2"></i>Trung tâm trợ giúp</button></li>
                <li><hr className="dropdown-divider"/></li>
                <li><button className="dropdown-item" type="button" onClick={logout}>Đăng xuất</button></li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Search Box */}
      <div id="search-box" className="align-items-center" style={{
        margin: '5px auto',
        marginTop: '-75px',
        zIndex: 10,
        position: 'relative',
        width: '100%',
        maxWidth: '1312px',
        position: 'sticky',
        top: 0
      }}>
        <form className="p-4 bg-white shadow d-flex rounded-pill flex-wrap gap-3 align-items-center justify-content-between"
              onSubmit={handleSearchSubmit}>
          {/* Location */}
          <div style={{
            width: '300px',
            marginLeft: '25px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px'
          }}>
            <label htmlFor="location" className="form-label mb-0" style={{fontWeight: 600}}>Địa điểm</label><br/>
            <input 
              type="text" 
              id="location" 
              name="location" 
              className="form-control border-0 p-0" 
              placeholder="Tìm kiếm điểm đến" 
              style={{marginTop: '5px', fontSize: '15px'}}
              value={searchForm.location}
              onChange={(e) => setSearchForm({...searchForm, location: e.target.value})}
            />
          </div>

          <div className="vr"></div>

          {/* Check-in */}
          <div style={{
            width: '130px',
            marginLeft: '5px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px'
          }}>
            <label htmlFor="checkin" className="form-label mb-0" style={{fontWeight: 600}}>Nhận phòng</label><br/>
            <input 
              type="date" 
              id="checkin" 
              name="checkin" 
              className="form-control border-0 p-0" 
              style={{marginTop: '5px', fontSize: '15px'}}
              value={searchForm.checkin}
              onChange={(e) => setSearchForm({...searchForm, checkin: e.target.value})}
            />
          </div>

          <div className="vr"></div>

          {/* Check-out */}
          <div style={{
            width: '130px',
            marginLeft: '5px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px'
          }}>
            <label htmlFor="checkout" className="form-label mb-0" style={{fontWeight: 600}}>Trả phòng</label><br/>
            <input 
              type="date" 
              id="checkout" 
              name="checkout" 
              className="form-control border-0 p-0" 
              style={{marginTop: '5px', fontSize: '15px'}}
              value={searchForm.checkout}
              onChange={(e) => setSearchForm({...searchForm, checkout: e.target.value})}
            />
          </div>

          <div className="vr"></div>

          {/* Guests */}
          <div style={{
            width: '100px',
            marginLeft: '5px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '14px'
          }}>
            <label htmlFor="guests" className="form-label mb-0" style={{fontWeight: 600}}>Khách</label><br/>
            <input 
              type="number" 
              id="guests" 
              name="guests" 
              className="form-control border-0 p-0" 
              min="1" 
              style={{marginTop: '5px', fontSize: '15px'}}
              value={searchForm.guests}
              onChange={(e) => setSearchForm({...searchForm, guests: parseInt(e.target.value)})}
            />
          </div>

          {/* Search Button */}
          <button type="submit" className="btn btn-danger rounded-circle ms-auto" style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px'
          }}>
            <i className="bi bi-search" style={{fontSize: '18px'}}></i>
          </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="container mt-5">
        {/* Inspire Section */}
        <h6 className="mb-3 fw-bold" style={{fontSize: '20px'}}>Truyền cảm hứng cho chuyến đi tiếp theo của bạn</h6>
        
        <div className="row g-3 mb-5">
          {/* Destination Cards */}
          {[
            { name: 'Hà Nội', distance: '15 phút lái xe', image: './images/hanoi.png' },
            { name: 'TP. Hồ Chí Minh', distance: '15 phút lái xe', image: './images/tphcm 1.png' },
            { name: 'Đà Lạt', distance: '4.5 giờ lái xe', image: './images/dalat2 1.png' },
            { name: 'Vũng Tàu', distance: '1.5 giờ lái xe', image: './images/vungtau 1.png' },
            { name: 'Nha Trang', distance: '6 giờ lái xe', image: './images/nhatrang 1.png' }
          ].map((destination, index) => (
            <div key={index} className="col-6 col-md-4 col-lg-2">
              <div className="card border-0">
                <img src={destination.image} className="card-img-top rounded-4" alt={destination.name}
                     style={{height: '96px', objectFit: 'cover'}} />
                <div className="card-body p-2">
                  <h6 className="card-title mb-1" style={{fontSize: '16px', fontWeight: 700}}>{destination.name}</h6>
                  <p className="card-text text-muted mb-0" style={{fontSize: '14px'}}>{destination.distance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Property Types */}
        <h6 className="mb-3 fw-bold" style={{fontSize: '20px'}}>Lưu trú theo loại chỗ ở</h6>
        
        <div className="row g-3 mb-5">
          {[
            { type: 'Khách sạn', image: './images/hotel_img.png' },
            { type: 'Căn hộ', image: './images/apartment img.png' },
            { type: 'Resort', image: './images/resort 1.png' },
            { type: 'Biệt thự', image: './images/minimalist-architecture-space 1.png' },
            { type: 'Homestay', image: './images/homestay 1.png' }
          ].map((property, index) => (
            <div key={index} className="col-6 col-md-4 col-lg-2">
              <div className="card border-0">
                <img src={property.image} className="card-img-top rounded-4" alt={property.type}
                     style={{height: '96px', objectFit: 'cover'}} />
                <div className="card-body p-2">
                  <h6 className="card-title mb-1" style={{fontSize: '16px', fontWeight: 700}}>{property.type}</h6>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Accommodation Sections */}
        {[
          { title: 'Nơi lưu trú tại Vũng Tàu', id: 'vung-tau-list', location: 'Vũng Tàu, Việt Nam' },
          { title: 'Nơi lưu trú tại Đà Lạt', id: 'da-lat-list', location: 'Đà Lạt, Lâm Đồng, Việt Nam' }
        ].map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-5">
            <h6 className="mb-3 fw-bold d-flex justify-content-between align-items-center">
              <span style={{fontSize: '20px'}}>{section.title}</span>
              <div className="d-flex align-items-center gap-2">
                <button className="d-flex align-items-center justify-content-center btn btn-outline-secondary rounded-circle me-2 chevron-left" 
                        onClick={() => scrollDestinations(-3, section.id)}>
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button className="d-flex align-items-center justify-content-center btn btn-light rounded-circle chevron-right" 
                        onClick={() => scrollDestinations(3, section.id)}>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </h6>

            <div id={section.id} className="scroll-x gap-3" style={{
              scrollBehavior: 'smooth',
              overflowX: 'hidden',
              display: 'flex'
            }}>
              {[...Array(5)].map((_, cardIndex) => (
                <div key={cardIndex} className="card p-0" style={{
                  width: '260px',
                  border: 'none',
                  fontFamily: "'Montserrat', sans-serif",
                  flexShrink: 0
                }}>
                  {/* Image Placeholder with overlay */}
                  <div className="position-relative rounded-4 overflow-hidden" style={{
                    height: '240px',
                    background: '#ddd'
                  }}>
                    {/* Heart Icon (top right) */}
                    <button onClick={(e) => toggleHeart(e.currentTarget)} 
                            className="position-absolute top-0 end-0 m-2 border-0 bg-transparent" 
                            style={{fontSize: '30px', color: 'red'}}>
                      <i className="bi bi-heart"></i>
                    </button>
                  </div>

                  {/* Text Content */}
                  <div className="p-2">
                    <p className="mb-1" style={{fontSize: '16px', fontWeight: 700}}>
                      {sectionIndex === 0 ? 'Căn hộ tại Vũng Tàu' : 'Homestay tại Đà Lạt'}
                    </p>
                    
                    <div className="mb-1" style={{fontSize: '16px', color: 'red'}}>
                      <i className="bi bi-geo-alt me-1"></i>
                      <span style={{color: 'black', fontSize: '14px'}}>{section.location}</span>
                    </div>
                    <div className="mb-1" style={{fontSize: '16px', color: 'rgb(255, 215, 0)'}}>
                      <i className="bi bi-star me-1"></i>
                      <span style={{color: 'black', fontSize: '14px'}}>5.0 - 1.130 đánh giá</span>
                    </div>
                    <div className="mb-1" style={{fontSize: '16px'}}>
                      <i className="bi bi-currency-dollar me-1"></i>
                      <span style={{color: 'black', fontSize: '14px', whiteSpace: 'nowrap'}}>
                        <strong>20.000.000 VND</strong> cho 1 đêm
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
