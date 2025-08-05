import React from 'react';
import './Reviews.css';
import starIcon from '../assets/star_filled.png';

const ReviewCard = () => (
    <div className="review-card">
        <div className="review-author">
            <div className="author-avatar"></div>
            <div className="author-info">
                <h4>Musk</h4>
                <p>Tháng 4 năm 2025</p>
            </div>
        </div>
        <div className="review-rating">
          <div className="rating-stars">
            <img src={starIcon} alt="Star" />
            <img src={starIcon} alt="Star" />
            <img src={starIcon} alt="Star" />
            <img src={starIcon} alt="Star" />
            <img src={starIcon} alt="Star" />
          </div>
          <span>-</span>
          <span>Tuyệt hảo</span>
        </div>
        <p className="review-text">Một nơi thật đẹp! Cảm ơn toàn đội đã biến thời gian lưu trú này thành một khoảnh khắc tuyệt vời. Rất nhiều điều nhỏ nhặt khiến tôi hài lòng về nơi này! Đầu ...</p>
        <button className="show-more-review">Hiển thị thêm</button>
    </div>
);

const Reviews = () => {
  return (
    <div className="reviews-section">
      <div className="review-list">
        <ReviewCard />
        <ReviewCard />
      </div>
       <button className="show-all-reviews">Hiển thị tất cả 39 đánh giá</button>
    </div>
  );
};

export default Reviews;