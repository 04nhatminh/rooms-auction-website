// src/pages/SearchResult/SearchResult.js
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchCacheProvider, useSearchCache } from '../../contexts/SearchCacheContext';
import { productApi } from '../../api/productApi';
import { auctionApi } from '../../api/auctionApi';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import TabLayout from '../../components/TabLayout/TabLayout';
import Filtering from '../../components/Filtering/Filtering';
import SearchRes_RoomSection from '../../components/SearchRes_RoomSection/SearchRes_RoomSection';
import SearchRes_AuctionSection from '../../components/SearchRes_AuctionSection/SearchRes_AuctionSection';
import './SearchResult.css';

const LIMIT = 20;

const SearchResultContent = () => {
  const location = useLocation();
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState(null);
  const [durationDays, setDurationDays] = useState(1);
  const [activeTab, setActiveTab] = useState('room');
  const [filters, setFilters] = useState({});
  const abortRef = useRef(null);
  const { clearCache } = useSearchCache();

  useEffect(() => {
    // Clear cache khi search params thay đổi (chuyển trang search mới)
    clearCache();
    
    const urlParams = new URLSearchParams(location.search);
    const locationId = urlParams.get('locationId');
    const type = (urlParams.get('type') || '').toLowerCase();
    const checkinStr = urlParams.get('checkinDate');
    const checkoutStr = urlParams.get('checkoutDate');

    if (checkinStr && checkoutStr) {
      const checkin = new Date(checkinStr);
      const checkout = new Date(checkoutStr);
      
      // Kiểm tra ngày hợp lệ
      if (!isNaN(checkin.getTime()) && !isNaN(checkout.getTime()) && checkout > checkin) {
        // Chênh lệch tính bằng mili-giây
        const diffMs = checkout - checkin;
        
        // Chuyển sang số ngày
        const calculatedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setDurationDays(calculatedDays > 0 ? calculatedDays : 1);
      } else {
        console.warn('Invalid dates provided:', checkinStr, checkoutStr);
        setDurationDays(1);
      }
    }
    else {
      setDurationDays(1);
    }

    // Không có locationId hoặc locationId === 'None' => clear danh sách
    if (!locationId || locationId === 'None') {
      setTopRatedProducts([]);
      return;
    }

    // Hủy request trước đó (nếu có)
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        let resp_room;
        let resp_auction;
        if (type === 'district') {
          console.log('\nnFetching products by district:', locationId);
          resp_room = await productApi.getTopRatedProductsByDistrict(locationId, LIMIT, controller.signal);
          console.log('Fetching auctions by district:', locationId);
          resp_auction = await auctionApi.getAuctionsByDistrictStatus(locationId, 'active', LIMIT, controller.signal);
        } else {
          // Mặc định coi là province
          console.log('\nFetching products by province:', locationId);
          resp_room = await productApi.getTopRatedProducts(locationId, LIMIT, controller.signal);
          console.log('Fetching auctions by province:', locationId);
          resp_auction = await auctionApi.getAuctionsByProvinceStatus(locationId, 'active', LIMIT, controller.signal);
        }

        const products = resp_room?.data?.products;
        console.log('\nAPI Response:', { resp_room, products });
        setTopRatedProducts(Array.isArray(products) ? products : []);

        const auctions = resp_auction?.data?.auctions;
        console.log('API Response:', { resp_auction, auctions });
        setActiveAuctions(Array.isArray(auctions) ? auctions : []);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Fetch search results failed:', err);
          setTopRatedProducts([]);
          setActiveAuctions([]);
        }
      }
    })();

    // Cleanup: hủy request khi unmount / đổi query
    return () => controller.abort();
  }, [location.search]);

  // Handler cho việc thay đổi tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Handler cho việc thay đổi filters
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
    // TODO: Implement filtering logic here
  };

  // Render nội dung dựa trên tab được chọn
  const renderDisplayResult = () => {
    switch (activeTab) {
      case 'room':
        return <SearchRes_RoomSection topRatedProducts={topRatedProducts} durationDays={durationDays} />;
      case 'auction':
        return <SearchRes_AuctionSection activeAuctions={activeAuctions} />;
    }
  };

  return (
    <>
      <Header />
      <TabLayout activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="display-result">
        <div className="filtering-section">
          <Filtering 
            type={activeTab} 
            onFiltersChange={handleFiltersChange}
          />
        </div>
        <div className="content-section">
          {renderDisplayResult()}
        </div>
      </div>
      <Footer />
    </>
  );
};

const SearchResult = () => {
  return (
    <SearchCacheProvider>
      <SearchResultContent />
    </SearchCacheProvider>
  );
};

export default SearchResult;
