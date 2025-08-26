import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './ResultPage.css'; // file CSS mới (ở mục 3)

function SuccessIcon() {
  return (
    <svg width="96" height="96" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#10B981" opacity="0.15" />
      <path d="M9.5 12.5l2 2 4-4" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function SuccessfulCheckoutPage() {
  const navigate = useNavigate();

  return (
    <div className="page-root">
      <Header />
      <main>
        <div className="result-wrap">
          <div className="result-card">
            <div className="result-icon"><SuccessIcon /></div>
            <h2 className="result-title">Bạn đã đặt phòng thành công</h2>
            <p className="result-sub">Cảm ơn bạn! Chúc bạn có kỳ nghỉ vui vẻ!</p>

            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Trở về trang chủ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
