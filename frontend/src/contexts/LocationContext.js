import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import LocationAPI from '../api/locationApi';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [popularLocations, setPopularLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Function để search locations với fallback đến popular locations
  const searchLocations = async (searchTerm, limit = 10) => {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        // Trả về top popular locations nếu không có search term
        return await getPopularLocations(limit);
      }

      const response = await LocationAPI.searchLocations(searchTerm, limit);
      return response;
    } catch (error) {
      console.error('Error searching locations:', error);
      
      // Fallback: filter popular locations nếu API fail
      const filteredPopular = popularLocations.filter(location => 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.displayText.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limit);

      return {
        success: true,
        data: {
          suggestions: filteredPopular
        }
      };
    }
  };

  // Function để lấy location suggestions theo từ khóa
  const getLocationSuggestions = async (searchTerm, limit = 10) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      // Trả về popular locations nếu không có search term
      return await getPopularLocations(limit);
    }
    
    try {
      const response = await LocationAPI.searchLocations(searchTerm, limit);
      return response;
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      
      // Fallback: filter popular locations nếu API fail
      const filteredPopular = popularLocations.filter(location => 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.displayText.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limit);

      return {
        success: true,
        data: {
          suggestions: filteredPopular
        }
      };
    }
  };

  // Function để lấy popular locations (với cache)
  const getPopularLocations = useCallback(async (limit = 5) => {
    // Nếu đã có data và đủ số lượng yêu cầu thì trả về luôn
    if (popularLocations.length >= limit && hasInitialized) {
      console.log('Using cached popular locations:', popularLocations.length);
      return {
        success: true,
        data: {
          suggestions: popularLocations.slice(0, limit)
        }
      };
    }

    // Nếu đang loading thì đợi
    if (isLoading) {
      console.log('Already loading, waiting...');
      return new Promise((resolve) => {
        const checkLoading = setInterval(() => {
          if (!isLoading) {
            clearInterval(checkLoading);
            resolve({
              success: true,
              data: {
                suggestions: popularLocations.slice(0, limit)
              }
            });
          }
        }, 100);
      });
    }

    // Nếu chưa có data hoặc không đủ, gọi API
    try {
      console.log('Fetching popular locations from API...');
      setIsLoading(true);
      setError(null);
      
      const response = await LocationAPI.getPopularLocations(limit);
      
      if (response.success) {
        setPopularLocations(response.data.suggestions || []);
        setHasInitialized(true);
        console.log('Successfully loaded popular locations:', response.data.suggestions?.length || 0);
      }
      
      return response;
    } catch (err) {
      console.error('Error fetching popular locations:', err);
      setError(err.message);
      return {
        success: false,
        message: err.message,
        data: { suggestions: [] }
      };
    } finally {
      setIsLoading(false);
    }
  }, [popularLocations, isLoading, hasInitialized]);

  const value = {
    popularLocations,
    isLoading,
    error,
    searchLocations,
    getLocationSuggestions,
    getPopularLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
