import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import bookingApi from '../../api/bookingApi';
import Footer from '../../components/Footer/Footer';
import './TransactionHistoryPage.css';

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    bookingApi.getUserTransactionHistory()
      .then(res => setTransactions(res.items || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <div className="transaction-history-page">
        <h2>Lịch sử mua hàng</h2>
        {loading ? <div>Đang tải...</div> : (
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
                <tr key={t.BookingID}>
                  <td>{t.room}</td>
                  <td>{t.date}</td>
                  <td>{t.method}</td>
                  <td>{t.amount?.toLocaleString('vi-VN')} đ</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loading ? <div>Đang tải...</div> : (
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
                <tr key={t.BookingID}>
                  <td>{t.room}</td>
                  <td>{t.date}</td>
                  <td>{t.method}</td>
                  <td>{t.amount?.toLocaleString('vi-VN')} đ</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
};

export default TransactionHistoryPage;
