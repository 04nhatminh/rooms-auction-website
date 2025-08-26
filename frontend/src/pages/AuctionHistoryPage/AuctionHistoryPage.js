import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import auctionApi from '../../api/auctionApi';
import './AuctionHistoryPage.css';

const AuctionHistoryPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <table className="auction-table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Ngày đấu giá</th>
                <th>Kết quả</th>
                <th>Giá cuối</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(a => (
                <tr key={a.AuctionID}>
                  <td>{a.room}</td>
                  <td>{a.date}</td>
                  <td>{a.status}</td>
                  <td>{a.price?.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default AuctionHistoryPage;
