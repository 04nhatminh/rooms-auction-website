// import React from 'react';
// import './Reviews.css';
// import starIcon from '../assets/star_filled.png';

// const ReviewCard = () => (
//     <div className="review-card">
//         <div className="review-author">
//             <div className="author-avatar"></div>
//             <div className="author-info">
//                 <h4>Musk</h4>
//                 <p>Tháng 4 năm 2025</p>
//             </div>
//         </div>
//         <div className="review-rating">
//           <div className="rating-stars">
//             <img src={starIcon} alt="Star" />
//             <img src={starIcon} alt="Star" />
//             <img src={starIcon} alt="Star" />
//             <img src={starIcon} alt="Star" />
//             <img src={starIcon} alt="Star" />
//           </div>
//           <span>-</span>
//           <span>Tuyệt hảo</span>
//         </div>
//         <p className="review-text">Một nơi thật đẹp! Cảm ơn toàn đội đã biến thời gian lưu trú này thành một khoảnh khắc tuyệt vời. Rất nhiều điều nhỏ nhặt khiến tôi hài lòng về nơi này! Đầu ...</p>
//         <button className="show-more-review">Hiển thị thêm</button>
//     </div>
// );

// const Reviews = () => {
//   return (
//     <div className="reviews-section">
//       <div className="review-list">
//         <ReviewCard />
//         <ReviewCard />
//       </div>
//        <button className="show-all-reviews">Hiển thị tất cả 39 đánh giá</button>
//     </div>
//   );
// };

// export default Reviews;


import React, { useMemo, useState } from 'react';
import './Reviews.css';
import starIcon from '../assets/star_filled.png';
import { useProduct } from '../contexts/ProductContext';
import DOMPurify from 'dompurify';

const Stars = ({ rating = 0 }) => {
  const filledCount = Math.round(Number(rating) || 0); // 0..5
  const items = Array.from({ length: 5 }, (_, i) => i < filledCount);
  return (
    <div className="rating-stars">
      {items.map((filled, idx) => (
        <img
          key={idx}
          src={starIcon}
          alt={filled ? 'Star filled' : 'Star'}
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
