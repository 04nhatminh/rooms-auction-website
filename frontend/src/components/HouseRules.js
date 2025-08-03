import React from 'react';
import './HouseRules.css';

const HouseRules = () => {
  return (
    <div className="house-rules-section">
      <h3>Quy tắc chung</h3>
      <div className="rules-container">
        <div className="rules-column">
          <h4>Nội quy nhà</h4>
          <p>Nhận phòng sau 14:00</p>
          <p>Tối đa 2 khách</p>
          <p>Được phép mang theo thú cưng</p>
          <button>Hiển thị thêm</button>
        </div>
        <div className="rules-column">
          <h4>An toàn và chỗ ở</h4>
          <p>Không có máy báo khói</p>
          <p>Chỗ ở có camera an ninh ngoài nhà</p>
          <p>Không cần dùng đến máy phát hiện khí CO</p>
          <button>Hiển thị thêm</button>
        </div>
        <div className="rules-column">
          <h4>Chính sách hủy</h4>
          <p>Bạn được hủy miễn phí trước 14:00, 17 thg 7. Bạn được hoàn tiền một phần nếu hủy trước khi nhận phòng/bắt đầu trải nghiệm vào 18 thg 7.</p>
          <button>Hiển thị thêm</button>
        </div>
      </div>
    </div>
  );
};

export default HouseRules;