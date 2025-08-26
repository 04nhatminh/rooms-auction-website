import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './ResultPage.css';

function FailIcon() {
  return (
    <svg width="96" height="96" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#EF4444" opacity="0.15" />
      <path d="M15 9l-6 6M9 9l6 6" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function FailedCheckoutPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // bạn có thể truyền ?productId=... hoặc ?return=/products/123
  const productUID = sp.get('productUID') || sp.get('roomuid');
  const backTo = sp.get('return');

  const goBackToProduct = () => {
    if (backTo) return navigate(backTo);
    if (productUID) return navigate(`/room/${productUID}`);
    return navigate(-1);
  };

  return (
    <div className="page-root">
      <Header />
      <main>
        <div className="result-wrap">
          <div className="result-card">
            <div className="result-icon"><FailIcon /></div>
            <h2 className="result-title">Bạn đã đặt phòng không thành công</h2>
            <p className="result-sub">Giao dịch chưa hoàn tất. Vui lòng thử lại phương thức khác hoặc kiểm tra lại thông tin.</p>

            <button className="btn btn-outline" onClick={goBackToProduct}>
              Trở về sản phẩm
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
