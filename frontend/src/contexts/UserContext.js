import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from sessionStorage when context initializes
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('userData');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user from sessionStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('userData', JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('token');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
