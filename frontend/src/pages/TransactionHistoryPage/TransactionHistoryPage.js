import React from 'react';
import Header from '../../components/Header/Header';
import './TransactionHistoryPage.css';

const TransactionHistoryPage = () => {
  // Dummy data for UI
  const transactions = [
    { id: 1, room: 'Phòng VIP 101', date: '2025-08-02', method: 'Paypal', amount: '2,000,000 đ', status: 'Thành công' },
    { id: 2, room: 'Phòng Deluxe 202', date: '2025-07-16', method: 'Zalopay', amount: '1,500,000 đ', status: 'Thất bại' },
  ];
  return (
    <>
      <Header />
      <div className="transaction-history-page">
        <h2>Lịch sử mua hàng</h2>
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Phòng</th>
              <th>Ngày giao dịch</th>
              <th>Phương thức</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{t.room}</td>
                <td>{t.date}</td>
                <td>{t.method}</td>
                <td>{t.amount}</td>
                <td>{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TransactionHistoryPage;
