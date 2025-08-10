// import React from 'react';
// import './HouseRules.css';
// import { useProduct } from '../contexts/ProductContext';


// const HouseRules = () => {
//   return (
//     <div className="house-rules-section">
//       <h3>Quy tắc chung</h3>
//       <div className="rules-container">
//         <div className="rules-column">
//           <h4>Nội quy nhà</h4>
//           <p>Nhận phòng sau 14:00</p>
//           <p>Tối đa 2 khách</p>
//           <p>Được phép mang theo thú cưng</p>
//           <button>Hiển thị thêm</button>
//         </div>
//         <div className="rules-column">
//           <h4>An toàn và chỗ ở</h4>
//           <p>Không có máy báo khói</p>
//           <p>Chỗ ở có camera an ninh ngoài nhà</p>
//           <p>Không cần dùng đến máy phát hiện khí CO</p>
//           <button>Hiển thị thêm</button>
//         </div>
//         <div className="rules-column">
//           <h4>Chính sách hủy</h4>
//           <p>Bạn được hủy miễn phí trước 14:00, 17 thg 7. Bạn được hoàn tiền một phần nếu hủy trước khi nhận phòng/bắt đầu trải nghiệm vào 18 thg 7.</p>
//           <button>Hiển thị thêm</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HouseRules;

import React, { useMemo, useState } from 'react';
import './HouseRules.css';
import { useProduct } from '../contexts/ProductContext';

// Component hiển thị một cột quy tắc với tiêu đề, danh sách các mục và nút để mở rộng/thu gọn
const RuleColumn = ({ title, items = [], subtitle, defaultCount = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, defaultCount);
  const hasMore = items.length > defaultCount;

  return (
    <div className="rules-column">
      <h4>{title}</h4>
      {subtitle && <p className="rules-subtitle">{subtitle}</p>}
      {visible.map((it, idx) => (
        <p key={idx}>{it}</p>
      ))}
      {hasMore && (
        <button onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Thu gọn' : 'Hiển thị thêm'}
        </button>
      )}
    </div>
  );
};

const HouseRules = () => {
  const { data } = useProduct();

  // Hỗ trợ cả 2 dạng: data.policies hoặc data.policies.Policies
  const policiesObj = useMemo(() => {
    const p = data?.policies;
    return p?.Policies ?? p ?? {};
  }, [data]);

  const houseRules = Array.isArray(policiesObj.house_rules) ? policiesObj.house_rules : [];
  const safetyProps = Array.isArray(policiesObj.safety_properties) ? policiesObj.safety_properties : [];
  const subtitle = policiesObj.house_rules_subtitle || '';
  const updatedAt = policiesObj.updated_at || data?.policies?.updated_at;

  // Nếu chưa có dữ liệu thì ẩn section
  if (!houseRules.length && !safetyProps.length) {
    return null;
  }

  return (
    <div className="house-rules-section">
      <h3>Quy tắc chung</h3>
      <div className="rules-container">
        {/* Nội quy nhà */}
        <RuleColumn
          title="Nội quy nhà"
          items={houseRules}
          subtitle={subtitle}
          defaultCount={3}
        />

        {/* An toàn và chỗ ở */}
        <RuleColumn
          title="An toàn và chỗ ở"
          items={safetyProps}
          defaultCount={3}
        />

        {/* Chính sách hủy – nếu bạn có field riêng thì thay vào đây; nếu chưa có thì ẩn cột */}
        {Array.isArray(policiesObj.cancellation) && policiesObj.cancellation.length > 0 && (
          <RuleColumn
            title="Chính sách hủy"
            items={policiesObj.cancellation}
            defaultCount={2}
          />
        )}
      </div>

      {updatedAt && (
        <div className="rules-updated-at">
          Cập nhật: {formatVNDate(updatedAt)}
        </div>
      )}
    </div>
  );
};

// format: "Cập nhật: 07/08/2025"
function formatVNDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default HouseRules;
