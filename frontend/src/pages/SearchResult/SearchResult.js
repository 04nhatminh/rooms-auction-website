// src/pages/SearchResult/SearchResult.js
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchCacheProvider, useSearchCache } from '../../contexts/SearchCacheContext';
import { productApi } from '../../api/productApi';
import { auctionApi } from '../../api/auctionApi';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import TabLayout from '../../components/TabLayout/TabLayout';
import Filtering from '../../components/Filtering/Filtering';
import SearchRes_RoomSection from '../../components/SearchRes_RoomSection/SearchRes_RoomSection';
import SearchRes_AuctionSection from '../../components/SearchRes_AuctionSection/SearchRes_AuctionSection';
import Pagination from '../../components/Pagination/Pagination';
import './SearchResult.css';

const LIMIT = 20;

const SearchResultContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState(null);
  const [durationDays, setDurationDays] = useState(1);
  const [activeTab, setActiveTab] = useState('room');
  const [filters, setFilters] = useState({});
  const [searchData, setSearchData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPagination, setProductsPagination] = useState(null);
  const [auctionsPagination, setAuctionsPagination] = useState(null);
  const abortRef = useRef(null);
  const { clearCache } = useSearchCache();

  // Hàm để fetch dữ liệu search results
  const fetchSearchResults = async (searchParams, page = 1) => {
    const locationId = searchParams.get('locationId');
    const type = (searchParams.get('type') || '').toLowerCase();
    const checkinStr = searchParams.get('checkinDate');
    const checkoutStr = searchParams.get('checkoutDate');

    // Cập nhật search data cho SearchBarMini
    setSearchData({
      location: searchParams.get('location')?.replace(/_/g, ' ') || '',
      checkinDate: checkinStr !== 'None' ? checkinStr : '',
      checkoutDate: checkoutStr !== 'None' ? checkoutStr : '',
      guests: `${parseInt(searchParams.get('numAdults') || 0) + parseInt(searchParams.get('numChildren') || 0)} khách`,
      locationId: locationId,
      locationType: type,
      guestCounts: {
        adults: parseInt(searchParams.get('numAdults') || 1),
        children: parseInt(searchParams.get('numChildren') || 0),
        infants: parseInt(searchParams.get('numInfants') || 0)
      }
    });

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
      setActiveAuctions([]);
      setProductsPagination(null);
      setAuctionsPagination(null);
      return;
    }

    // Hủy request trước đó (nếu có)
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let resp_room;
      let resp_auction;
      if (type === 'district') {
        console.log('\nFetching products by district:', locationId, 'page:', page);
        resp_room = await productApi.getTopRatedProductsByDistrict(locationId, LIMIT, controller.signal);
        console.log('Fetching auctions by district:', locationId, 'page:', page);
        resp_auction = await auctionApi.getAuctionsByDistrictStatus(locationId, 'active', LIMIT, controller.signal);
      } else {
        // Mặc định coi là province
        console.log('\nFetching products by province:', locationId, 'page:', page);
        resp_room = await productApi.getTopRatedProducts(locationId, LIMIT, controller.signal);
        console.log('Fetching auctions by province:', locationId, 'page:', page);
        resp_auction = await auctionApi.getAuctionsByProvinceStatus(locationId, 'active', LIMIT, controller.signal);
      }

      const products = resp_room?.data?.products;
      const pagination = resp_room?.data?.pagination;
      console.log('\nAPI Response:', { resp_room, products, pagination });
      setTopRatedProducts(Array.isArray(products) ? products : []);
      setProductsPagination(pagination);

      const auctions = resp_auction?.data?.auctions;
      const auctionPagination = resp_auction?.data?.pagination;
      console.log('API Response:', { resp_auction, auctions, auctionPagination });
      setActiveAuctions(Array.isArray(auctions) ? auctions : []);
      setAuctionsPagination(auctionPagination);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Fetch search results failed:', err);
        setTopRatedProducts([]);
        setActiveAuctions([]);
        setProductsPagination(null);
        setAuctionsPagination(null);
      }
    }
  };

  // Handler cho việc search submit từ SearchBarMini
  const handleSearchSubmit = (searchParams) => {
    // Clear cache khi có search mới
    clearCache();
    // Reset về trang 1 khi search mới
    setCurrentPage(1);
    // Fetch dữ liệu mới
    fetchSearchResults(searchParams, 1);
  };

  // Handler cho việc thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const urlParams = new URLSearchParams(location.search);
    fetchSearchResults(urlParams, page);
    
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Clear cache khi search params thay đổi (chuyển trang search mới)
    clearCache();
    // Reset về trang 1 khi có search params mới
    setCurrentPage(1);
    
    const urlParams = new URLSearchParams(location.search);
    fetchSearchResults(urlParams, 1);

    // Cleanup: hủy request khi unmount / đổi query
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [location.search]);
  // Handler cho việc thay đổi tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset về trang 1 khi chuyển tab
    setCurrentPage(1);
  };

  // Handler cho việc thay đổi filters
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
    // Reset về trang 1 khi apply filters
    setCurrentPage(1);
    // TODO: Implement filtering logic here
  };

  // Render nội dung dựa trên tab được chọn
  const renderDisplayResult = () => {
    switch (activeTab) {
      case 'room':
        return (
          <>
            <SearchRes_RoomSection topRatedProducts={topRatedProducts} durationDays={durationDays} />
            <Pagination 
              pagination={productsPagination} 
              onPageChange={handlePageChange} 
            />
          </>
        );
      case 'auction':
        return (
          <>
            <SearchRes_AuctionSection activeAuctions={activeAuctions} />
            <Pagination 
              pagination={auctionsPagination} 
              onPageChange={handlePageChange} 
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header 
        searchData={searchData}
        onSearchSubmit={handleSearchSubmit}
      />
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
