import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [noti, setNoti] = useState(null);
  const lastShownRef = useRef(new Set());
  const mountedAtRef = useRef(Date.now()); // mốc thời gian khi Provider mount

  const showNoti = (message, type = 'info', duration = 4000) => {
    setNoti({ message, type });
    setTimeout(() => setNoti(null), duration);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.BASE_URL}/user/notifications`, {
          credentials: 'include'
        });
        const data = await res.json();
        const items = data.items || [];
        for (const n of items) {
          // Chỉ hiện popup cho thông báo chưa đọc
          if (!n.IsRead) {
            // Hiện popup
            if (n.Type === 'win') showNoti('Chúc mừng! Bạn đã thắng phiên đấu giá.', 'success');
            else if (n.Type === 'lose') showNoti('Rất tiếc! Bạn đã không thắng phiên đấu giá.', 'failed');
            // Đánh dấu đã đọc (gọi API)
            fetch(`${process.env.BASE_URL}/user/notifications/${n.NotificationID}/read`, {
              method: 'POST',
              credentials: 'include'
            });
          }
        }
      } catch (e) {}
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNoti }}>
      {children}
      {noti && (
        <div className={`global-notification ${noti.type}`}>
          {noti.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}