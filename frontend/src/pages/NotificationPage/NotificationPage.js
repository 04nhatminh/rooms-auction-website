import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './NotificationPage.css';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
    const userId = userData?.id || userData?.userId;

    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user/notifications`, {
          credentials: 'include'
        });
        const data = await res.json();
        setNotifications(data?.items || []);
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchNotifications();
    else setLoading(false);
  }, []);

  return (
    <div className="notification-page">
      <Header />
      <main>
        <h2>Thông báo đấu giá của bạn</h2>
        {loading ? (
          <div>Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">Không có thông báo nào.</div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n, idx) => {
              // Map dữ liệu từ DB sang format UI
              const status = n.Type === 'win' ? 'success' : n.Type === 'lose' ? 'failed' : 'ended';
              const title = n.Type === 'win' ? 'Bạn đã thắng phiên!' : n.Type === 'lose' ? 'Bạn đã thua phiên.' : 'Kết thúc phiên';
              const time = n.CreatedAt ? new Date(n.CreatedAt).toLocaleString('vi-VN') : '';
              return (
                <li key={n.NotificationID || idx} className={`notification-item ${status}`}>
                  <strong>{title}</strong>
                  <div>{n.Message}</div>
                  <div className="notification-time">{time}</div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NotificationPage;