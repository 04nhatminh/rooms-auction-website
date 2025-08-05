import React from 'react';
import Header from '../components/Header';
import RoomTitle from '../components/RoomTitle';
import ImageGallery from '../components/ImageGallery';
import Overview from '../components/Overview';
import Description from '../components/Description';
import Amenities from '../components/Amenities';
import Calendar from '../components/Calendar';
import Reviews from '../components/Reviews';
import Location from '../components/Location';
import HouseRules from '../components/HouseRules';
import Footer from '../components/Footer';
import './RoomDetailPage.css';

const RoomDetailPage = () => {
  return (
    <div className="room-detail-page">
      <Header />
      <main className="room-detail-content">
        <RoomTitle />
        <ImageGallery />
        <div className="main-content">
          <div className="left-column">
            <Overview />
            <hr />
            <Description />
            <hr />
            <Amenities />
            <hr />
            <Calendar />
          </div>
        </div>
        <hr />
        <Reviews />
        <hr />
        <Location />
        <hr />
        <HouseRules />
      </main>
      <Footer />
    </div>
  );
};

export default RoomDetailPage;
