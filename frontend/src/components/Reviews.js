import React, { useMemo, useState } from 'react';
import './Reviews.css';
import starIcon from '../assets/star_filled.png';
import { useProduct } from '../contexts/ProductContext';
import DOMPurify from 'dompurify';

const Stars = ({ rating = 0 }) => {
  const filledCount = Math.floor(Number(rating) || 0); // 0..5
  const items = Array.from({ length: 5 }, (_, i) => i < filledCount);
  return (
    <div className="rating-stars" aria-label={`${filledCount}/5`}>
      {items.map((filled, idx) => (
        <img
          key={idx}
          src={starIcon}
          alt={filled ? 'Star filled' : 'Star empty'}
          className={filled ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );
};

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);

  // Lấy tên an toàn
  const r = review?.reviewer || {};
  const name = r.firstName || 'Ẩn danh';

  const avatarUrl = r.pictureUrl || '';
  const created = formatViMonthYear(review?.createdAt);
  const text = review?.comments || '';
  const MAX = 220;
  const isLong = text.length > MAX;
  const shown = expanded || !isLong ? text : text.slice(0, MAX) + '…';

  return (
    <div className="review-card">
      <div className="review-author">
        {avatarUrl ? (
          <img className="author-avatar-img" src={avatarUrl} alt={name} />
        ) : (
          <div className="author-avatar">{getInitials(name)}</div>
        )}
        <div className="author-info">
          <h4>{name}</h4>
          <p>{created}</p>
        </div>
      </div>

      <div className="review-rating">
        <Stars rating={review?.rating} />
        <span>-</span>
        <span>
          {Number(review?.rating) >= 5
            ? 'Tuyệt hảo'
            : Number(review?.rating) >= 4
            ? 'Rất tốt'
            : Number(review?.rating) >= 3
            ? 'Tốt'
            : Number(review?.rating) >= 2
            ? 'Bình thường'
            : 'Kém'}
        </span>
      </div>

      <p className="review-text" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(shown)}}/>

      {isLong && (
        <button className="show-more-review" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Thu gọn' : 'Hiển thị thêm'}
        </button>
      )}
    </div>
  );
};

const Reviews = ({ reviewsData }) => {
  // Ưu tiên prop; nếu không có thì lấy từ context
  const { data } = useProduct();
  const reviewsObj = reviewsData || data?.reviews;

  const list = useMemo(() => {
    return Array.isArray(reviewsObj?.reviews) ? reviewsObj.reviews : [];
  }, [reviewsObj]);

  const total = reviewsObj?.total_reviews ?? list.length ?? 0;

  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? list : list.slice(0, 2);

  if (!list.length) {
    return (
      <div className="reviews-section">
        <div className="review-list empty">Chưa có đánh giá nào.</div>
      </div>
    );
  }

  return (
    <div className="reviews-section">
      <div className="review-list">
        {visible.map((rv) => (
          <ReviewCard key={rv.externalId || rv._id || rv.createdAt} review={rv} />
        ))}
      </div>

      {list.length > 2 && (
        <button className="show-all-reviews" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Thu gọn' : `Hiển thị tất cả ${total} đánh giá`}
        </button>
      )}
    </div>
  );
};

// Format: "Tháng 7 năm 2025"
function formatViMonthYear(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `Tháng ${month} năm ${year}`;
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

export default Reviews;
