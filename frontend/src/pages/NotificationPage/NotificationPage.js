import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './NotificationPage.css';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy userId hiện tại từ sessionStorage
    const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
    const userId = userData?.id || userData?.userId;

    async function fetchNotifications() {
      setLoading(true);
      try {
        // Giả sử có API /api/auction/notifications?userId=<id>
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/auction/notifications?userId=${userId}`);
        const data = await res.json();
        setNotifications(data?.notifications || []);
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
          <div>Không có thông báo nào.</div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n, idx) => (
              <li key={idx} className={`notification-item ${n.status}`}>
                <strong>{n.title}</strong>
                <div>{n.message}</div>
                <div className="notification-time">{n.time}</div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NotificationPage;