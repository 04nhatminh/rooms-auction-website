import React from 'react';
import './Reviews.css';
import starIcon from '../assets/star_filled.png';

const RatingBar = ({ label, score }) => (
  <div className="rating-bar-container">
    <span>{label}</span>
    <div className="bar-wrapper">
      <div className="bar" style={{ width: `${(score / 5) * 100}%` }}></div>
    </div>
    <span>{score.toFixed(1)}</span>
  </div>
);

const ReviewCard = () => (
    <div className="review-card">
        <div className="review-author">
            <div className="author-avatar"></div>
            <div className="author-info">
                <h4>Musk</h4>
                <p>Tháng 4 năm 2025</p>
            </div>
        </div>
        <div className="review-rating">★★★★★ - Tuyệt hảo</div>
        <p className="review-text">Một nơi thật đẹp! Cảm ơn toàn đội đã biến thời gian lưu trú này thành một khoảnh khắc tuyệt vời. Rất nhiều điều nhỏ nhặt khiến tôi hài lòng về nơi này! Đầu ...</p>
        <button className="show-more-review">Hiển thị thêm</button>
    </div>
);

const Reviews = () => {
  return (
    <div className="reviews-section">
      <h3>Đánh giá của khách hàng</h3>
      <h2><img src={starIcon} alt="Star Icon" /> 4,9 - 39 đánh giá</h2>
      <div className="detailed-ratings">
        <RatingBar label="Sạch sẽ" score={4.8} />
        <RatingBar label="Vị trí" score={4.9} />
        <RatingBar label="Phục vụ" score={4.9} />
        <RatingBar label="Giá trị" score={4.9} />
        <RatingBar label="Giao tiếp" score={4.9} />
        <RatingBar label="Tiện nghi" score={4.9} />
      </div>
      <div className="review-list">
        <ReviewCard />
        <ReviewCard />
      </div>
       <button className="show-all-reviews">Hiển thị tất cả 39 đánh giá</button>
    </div>
  );
};

export default Reviews;