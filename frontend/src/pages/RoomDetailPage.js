import React, { useState, useEffect } from 'react';
import { ProductContext } from '../contexts/ProductContext';
import { DateRangeProvider } from '../contexts/DateRangeContext';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import RoomTitle from '../components/RoomTitle';
import ImageGallery from '../components/ImageGallery';
import Overview from '../components/Overview';
import Description from '../components/Description';
import Amenities from '../components/Amenities';
import Calendar from '../components/Calendar';
import Rating from '../components/Rating';
import Reviews from '../components/Reviews';
import Location from '../components/Location';
import HouseRules from '../components/HouseRules';
import Footer from '../components/Footer';
import BookingCard from '../components/BookingCard';
import './RoomDetailPage.css';

const RoomDetailPage = () => {
  const { UID } = useParams(); // get UID from URL
  const [data, setData] = useState(null);
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`/api/room/${UID}`)
      .then((res) => {
        console.log("✅ API response:", res.data);
        setData(res.data.data);
      })
      .catch((err) => {
        console.error("Error loading product data", err);
        setError(err?.response?.data?.message || err.message || 'Không thể tải dữ liệu sản phẩm.');
      });
  }, [UID]);
  
  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading...</p>;
  return (
    <div className="room-detail-page">
      <ProductContext.Provider value={{ data, setData }}> 
        <DateRangeProvider>
          <Header />
            <main className="room-detail-content">
                <RoomTitle />
                <ImageGallery />
              <div className="main-content">
                <div className="left-column">
                  <Overview />
                  <hr />
                  <Description/>
                  <hr />
                  <Amenities />
                  <hr />
                  <Calendar />
                </div>
                <div className="right-column">
                  <BookingCard />
                </div>
              </div>
              <hr />
              <Rating />
              <hr />
              <Reviews />
              <hr />
              <Location />
              <hr />
              <HouseRules />
            </main>
          <Footer />
        </DateRangeProvider>
      </ProductContext.Provider>
    </div>
  );
};

export default RoomDetailPage;
