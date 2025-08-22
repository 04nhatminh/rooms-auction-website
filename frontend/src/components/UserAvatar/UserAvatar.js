import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAPI from '../../api/userApi';
import './UserAvatar.css';

const UserAvatar = ({ size = 'medium', showNavigation = true }) => {
  const [user, setUser] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin user từ localStorage trước
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Sau đó fetch thông tin mới nhất từ API
    const fetchUserData = async () => {
      try {
        const response = await UserAPI.getProfile();
        if (response.user) {
          setUser(response.user);
          // Cập nhật localStorage với dữ liệu mới
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Nếu lỗi 401 (unauthorized), có thể redirect về login
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          // Không redirect tự động, để component cha xử lý
        }
      }
    };

    fetchUserData();
  }, []);

  const handleAvatarClick = () => {
    if (showNavigation) {
      navigate('/profile');
    }
  };

  const handleImageError = () => {
    setAvatarError(true);
  };

  const getInitials = () => {
    if (!user) return 'U';
    
    // Lấy chữ cái đầu tiên từ lastName, nếu không có thì lấy từ fullName
    if (user.lastName) {
      return user.lastName.charAt(0).toUpperCase();
    } else if (user.fullName) {
      const names = user.fullName.trim().split(' ');
      // Lấy chữ cái đầu của tên cuối (last name)
      return names[names.length - 1].charAt(0).toUpperCase();
    } else if (user.name) {
      const names = user.name.trim().split(' ');
      return names[names.length - 1].charAt(0).toUpperCase();
    }
    return 'U';
  };

  const isValidAvatar = (avatarURL) => {
    return avatarURL && 
           typeof avatarURL === 'string' && 
           avatarURL.trim() !== '' && 
           avatarURL !== 'null' && 
           avatarURL !== 'undefined' &&
           !avatarError;
  };

  const sizeClass = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large'
  };

  return (
    <div 
      className={`user-avatar ${sizeClass[size]} ${showNavigation ? 'clickable' : ''}`}
      onClick={handleAvatarClick}
    >
      {user && isValidAvatar(user.avatarURL) ? (
        <img 
          src={user.avatarURL} 
          alt="User Avatar" 
          className="avatar-image"
          onError={handleImageError}
        />
      ) : (
        <div className="avatar-initials">
          {getInitials()}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
