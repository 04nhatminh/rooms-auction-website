import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SearchResult.css';
import Header from '../components/Header';
import CardSection from '../components/CardSection';
import SearchRes_RoomSection from '../components/SearchRes_RoomSection';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';


const SearchResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
    // Lấy parameters từ URL
    const urlParams = new URLSearchParams(location.search);
    const params = {
      provinceCode: urlParams.get('provinceCode'),
      checkinDate: urlParams.get('checkinDate'),
      checkoutDate: urlParams.get('checkoutDate'),
      numAdults: urlParams.get('numAdults'),
      numChildren: urlParams.get('numChildren'),
      numInfants: urlParams.get('numInfants')
    };
    
    setSearchParams(params);
    console.log('Received search parameters:', params);
  }, [location.search]);

  return (
    <>
      <Header />
      
      {/* Hiển thị thông tin parameters để test */}
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
        <h3>Thông tin tìm kiếm nhận được:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
          <p><strong>Province Code:</strong> {searchParams.provinceCode || 'Không có'}</p>
          <p><strong>Check-in Date:</strong> {searchParams.checkinDate || 'Không có'}</p>
          <p><strong>Check-out Date:</strong> {searchParams.checkoutDate || 'Không có'}</p>
          <p><strong>Số người lớn:</strong> {searchParams.numAdults || 'Không có'}</p>
          <p><strong>Số trẻ em:</strong> {searchParams.numChildren || 'Không có'}</p>
          <p><strong>Số trẻ sơ sinh:</strong> {searchParams.numInfants || 'Không có'}</p>
        </div>
      </div>

      <SearchRes_RoomSection/>
      <SearchRes_RoomSection/>
      <SearchRes_RoomSection/>
      <Footer />
    </>
  );
};

export default SearchResult;