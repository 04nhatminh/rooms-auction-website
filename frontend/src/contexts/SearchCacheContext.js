import React, { createContext, useContext, useRef } from 'react';

const SearchCacheContext = createContext();

export const useSearchCache = () => {
  const context = useContext(SearchCacheContext);
  if (!context) {
    throw new Error('useSearchCache must be used within a SearchCacheProvider');
  }
  return context;
};

export const SearchCacheProvider = ({ children }) => {
  // Cache cho images và reviews theo UID
  const cacheRef = useRef(new Map());

  // Clear toàn bộ cache (khi chuyển trang search mới)
  const clearCache = () => {
    console.log('Clearing search cache');
    cacheRef.current.clear();
  };

  // Get cached data
  const getCachedData = (key) => {
    const data = cacheRef.current.get(key);
    if (data) {
      console.log('Cache hit for key:', key);
    }
    return data;
  };

  // Set cached data
  const setCachedData = (key, data) => {
    console.log('Caching data for key:', key);
    cacheRef.current.set(key, data);
  };

  // Check if data exists in cache
  const hasCachedData = (key) => {
    return cacheRef.current.has(key);
  };

  // Generate cache key cho room section
  const generateRoomCacheKey = (topRatedProducts) => {
    if (!topRatedProducts || topRatedProducts.length === 0) return null;
    const key = `room_${topRatedProducts.map(p => p.ProductID).sort().join('_')}`;
    return key;
  };

  // Generate cache key cho auction section
  const generateAuctionCacheKey = (activeAuctions) => {
    if (!activeAuctions || activeAuctions.length === 0) return null;
    const key = `auction_${activeAuctions.map(a => a.AuctionUID).sort().join('_')}`;
    return key;
  };

  // Get cache size (for debugging)
  const getCacheSize = () => {
    return cacheRef.current.size;
  };

  const value = {
    clearCache,
    getCachedData,
    setCachedData,
    hasCachedData,
    generateRoomCacheKey,
    generateAuctionCacheKey,
    getCacheSize
  };

  return (
    <SearchCacheContext.Provider value={value}>
      {children}
    </SearchCacheContext.Provider>
  );
};
