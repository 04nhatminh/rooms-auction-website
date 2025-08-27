import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [noti, setNoti] = useState(null);
  const lastShownRef = useRef(new Set());

  const showNoti = (message, type = 'info', duration = 4000) => {
    setNoti({ message, type });
    setTimeout(() => setNoti(null), duration);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user/notifications`, {
          credentials: 'include'
        });
        const data = await res.json();
        const items = data.items || [];
        // Chỉ hiện thông báo chưa từng hiện
        for (const n of items) {
          if (!lastShownRef.current.has(n.NotificationID)) {
            lastShownRef.current.add(n.NotificationID);
            if (n.Type === 'win') showNoti('Chúc mừng! Bạn đã thắng phiên đấu giá.', 'success');
            else if (n.Type === 'lose') showNoti('Rất tiếc! Bạn đã không thắng phiên đấu giá.', 'failed');
          }
        }
      } catch (e) {}
    }, 10000); // 10s

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