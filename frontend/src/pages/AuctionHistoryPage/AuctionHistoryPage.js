import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import auctionApi from '../../api/auctionApi';
import Footer from '../../components/Footer/Footer';
import './AuctionHistoryPage.css';

const AuctionHistoryPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    auctionApi.getUserAuctionHistory()
      .then(res => setAuctions(res.items || []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <div className="auction-history-page">
        <h2>Lịch sử đấu giá</h2>
        {loading ? <div>Đang tải...</div> : (
          <div className="auction-history-table-wrap">
            <table className="auction-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Phòng</th>
                  <th style={{ textAlign: 'center' }}>Ngày kết thúc đấu giá</th>
                  <th style={{ textAlign: 'center' }}>Kết quả</th>
                  <th style={{ textAlign: 'center' }}>Số tiền thắng</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map(a => (
                  <tr key={a.auctionUid} className="auction-row" onClick={() => navigate(`/auction/${a.auctionUid}`)}>
                    <td style={{ textAlign: 'left' }}>{a.room}</td>
                    <td style={{ textAlign: 'center' }}>{a.date}</td>
                    <td style={{ textAlign: 'center' }}>{a.result}</td>
                    <td style={{ textAlign: 'center' }}>
                      {a.result === 'Thắng' && a.winAmount
                        ? <span className="win-amount">{a.winAmount.toLocaleString('vi-VN')} đ</span>
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AuctionHistoryPage;
