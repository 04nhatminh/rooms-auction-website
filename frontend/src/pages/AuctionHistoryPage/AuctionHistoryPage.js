import React from 'react';
import Header from '../../components/Header/Header';
import './AuctionHistoryPage.css';

const AuctionHistoryPage = () => {
  // Dummy data for UI
  const auctions = [
    { id: 1, room: 'Phòng VIP 101', date: '2025-08-01', status: 'Thắng', price: '2,000,000 đ' },
    { id: 2, room: 'Phòng Deluxe 202', date: '2025-07-15', status: 'Thua', price: '1,500,000 đ' },
  ];
  return (
    <>
      <Header />
      <div className="auction-history-page">
        <h2>Lịch sử đấu giá</h2>
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
              <tr key={a.id}>
                <td>{a.room}</td>
                <td>{a.date}</td>
                <td>{a.status}</td>
                <td>{a.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AuctionHistoryPage;
