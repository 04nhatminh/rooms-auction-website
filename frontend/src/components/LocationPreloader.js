import React from 'react';
import { useLocation } from '../contexts/LocationContext';

const LocationPreloader = ({ children }) => {
  const { isLoading, error } = useLocation();

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #278C9F',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
          marginTop: '16px',
          color: '#278C9F',
          fontFamily: 'Montserrat',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Đang tải dữ liệu địa điểm...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    console.warn('Location preload error:', error);
    // Không hiển thị lỗi cho user, chỉ log để debug
  }

  return children;
};

export default LocationPreloader;
