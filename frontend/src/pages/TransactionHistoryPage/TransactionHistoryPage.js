import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import bookingApi from '../../api/bookingApi';
import TransactionHistory from '../../components/TransactionHistory/TransactionHistory';

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
      <main>
        <TransactionHistory title="Lịch sử giao dịch" transactions={transactions} />
      </main>
      <Footer />
    </>
  );
};

export default TransactionHistoryPage;
