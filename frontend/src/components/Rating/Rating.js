import React, {useMemo} from 'react';
import { useProduct } from '../../contexts/ProductContext';
import './Rating.css';
import starIcon from '../../assets/star_filled.png';
import broomIcon from '../../assets/broom.png';
import locationPinIcon from '../../assets/location_pin.png';
import waiterIcon from '../../assets/waiter.png';
import priceTagIcon from '../../assets/price_tag.png';
import talkingIcon from '../../assets/talking.png';
import restIcon from '../../assets/rest.png';


const RatingBar = ({ label, score }) => (
  <div className="rating-bar-container">
    <span>{label}</span>
    <div className="bar-wrapper">
      <div className="bar" style={{ width: `${(score / 10) * 100}%` }}></div>
    </div>
  </div>
);

const CategoryCard = ({ title, score, icon }) => (
  <div className="category-card">
    <span className="category-title">{title}</span>
    <span className="category-score">{score}</span>
    <img src={icon} alt={title} className="category-icon" />
  </div>
);

const Rating = () => {
  const { data } = useProduct();

  const barScores = useMemo(() => {
    const pr = data?.reviews;
    return {
      5: getRatingScore(pr, 5),
      4: getRatingScore(pr, 4),
      3: getRatingScore(pr, 3),
      2: getRatingScore(pr, 2),
      1: getRatingScore(pr, 1),
    };
  }, [data]);
  return (
    <div className="rating-section">
      <h3>Đánh giá của khách hàng</h3>
      <h2><img src={starIcon} alt="Star Icon" /> {data?.averageRating || 0} - {data?.reviews?.total_reviews || 0} đánh giá</h2>
      <div className="detailed-ratings">
        <div className="rating-bars-column">
          <RatingBar label="5" score={barScores[5] || 0} />
          <RatingBar label="4" score={barScores[4] || 0} />
          <RatingBar label="3" score={barScores[3] || 0} />
          <RatingBar label="2" score={barScores[2] || 0} />
          <RatingBar label="1" score={barScores[1] || 0} />
        </div>
        <div className="line"></div>
        <div className="categories-column">
          <CategoryCard title="Sạch sẽ" score={(data?.details?.CleanlinessPoint || 0).toFixed(1)} icon={broomIcon} />
          <CategoryCard title="Vị trí" score={(data?.details?.LocationPoint || 0).toFixed(1)} icon={locationPinIcon} />
          <CategoryCard title="Phục vụ" score={(data?.details?.ServicePoint || 0).toFixed(1)} icon={waiterIcon} />
          <CategoryCard title="Giá trị" score={(data?.details?.ValuePoint || 0).toFixed(1)} icon={priceTagIcon} />
          <CategoryCard title="Giao tiếp" score={(data?.details?.CommunicationPoint || 0).toFixed(1)} icon={talkingIcon} />
          <CategoryCard title="Tiện nghi" score={(data?.details?.ConveniencePoint || 0).toFixed(1)} icon={restIcon} />
        </div>
      </div>
    </div>
  );
};


function getRatingScore(productReviews, rating) {
    if (!productReviews || !Array.isArray(productReviews.reviews)) return 0;

    const count = productReviews.reviews.filter(review => review.rating === rating).length;

    return (count / productReviews.total_reviews) * 10; // Scale to 10
}

export default Rating;