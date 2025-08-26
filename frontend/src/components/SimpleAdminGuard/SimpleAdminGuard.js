import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SimpleAdminGuard = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra sessionStorage
    const userData = sessionStorage.getItem('userData');
    
    if (!userData) {
      // Không có userData -> về login
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        // Không phải admin -> về home
        navigate('/');
        return;
      }
    } catch (error) {
      // userData không hợp lệ -> về login
      sessionStorage.removeItem('userData');
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Kiểm tra trước khi render
  const userData = sessionStorage.getItem('userData');
  if (!userData) {
    return null; // Đang redirect
  }

  try {
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return null; // Đang redirect
    }
  } catch (error) {
    return null; // Đang redirect
  }

  return children;
};

export default SimpleAdminGuard;
