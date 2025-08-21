import React, { useState, useEffect } from 'react';
import { ProductContext } from '../../contexts/ProductContext';
import { DateRangeProvider } from '../../contexts/DateRangeContext';
import { useParams } from 'react-router-dom';
import productApi from '../../api/productApi';
import Header from '../../components/Header/Header';
import RoomTitle from '../../components/RoomTitle/RoomTitle';
import ImageGallery from '../../components/ImageGallery/ImageGallery';
import Overview from '../../components/Overview/Overview';
import Description from '../../components/Description/Description';
import Amenities from '../../components/Amenities/Amenities';
import Calendar from '../../components/Calendar/Calendar';
import Rating from '../../components/Rating/Rating';
import Reviews from '../../components/Review/Reviews';
import Location from '../../components/Location/Location';
import HouseRules from '../../components/HouseRules/HouseRules';
import Footer from '../../components/Footer/Footer';
import BookingCard from '../../components/BookingCard/BookingCard';
import './RoomDetailPage.css';

const RoomDetailPage = () => {
  const { UID } = useParams(); // get UID from URL
  const [data, setData] = useState(null);
  const [error, setError] = useState(null)

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setError(null);
        const resJson = await productApi.getRoomByUID(UID, ac.signal);
        // Backend của bạn đang trả { data: ... } và trước đây bạn set res.data.data
        setData(resJson.data);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Không thể tải dữ liệu sản phẩm.');
        console.error('Error loading product data', err);
      }
    })();

    return () => ac.abort();
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
