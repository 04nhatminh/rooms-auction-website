import React from 'react';
import './BookingInfo.css';

const BookingInfo = () => {
  return (
    <div className="booking-info">
      <div className="listing-header">
        <h2>Toàn bộ căn hộ cho thuê tại Vũng Tàu, Việt Nam</h2>
        <p>2 phòng khách - 1 phòng ngủ - 1 giường - 1 phòng tắm</p>
        <p>⭐ 4,82 - <u>17 đánh giá</u></p>
      </div>
      <hr />
      <div className="about-place">
        <h3>Giới thiệu về chỗ ở này</h3>
        <p>Chúng tôi cung cấp không gian sống sang trọng, ấm áp, đầy đủ tiện nghi như ở nhà với những vật dụng sản phẩm thân thiện, bảo vệ môi trường...</p>
        <button>Hiển thị thêm</button>
      </div>
    </div>
  );
};

export default BookingInfo;