import React, { useState, useEffect, useRef, memo } from 'react';
import AuctionCard from '../AuctionCard/AuctionCard';
import './AuctionSection.css';
import { imageApi } from '../../api/imageApi';
import { reviewApi } from '../../api/reviewApi';
import { auctionApi } from '../../api/auctionApi';
import chevronLeftGrayIcon from '../../assets/chevron_left_gray.png';
import chevronRightGrayIcon from '../../assets/chevron_right_gray.png';
import chevronLeftBlackIcon from '../../assets/chevron_left_black.png';
import chevronRightBlackIcon from '../../assets/chevron_right_black.png';

const AuctionSection = memo(({ type, title, limit = 15 }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [itemsPerView] = useState(5); // Hiển thị 5 items cùng lúc
  const [scrollStep] = useState(2); // Scroll 2 items mỗi lần
  
  // Thêm refs để quản lý cache và request
  const cacheRef = useRef(new Map());
  const currentRequestRef = useRef(null);
  
  // Tính toán pagination
  const maxStartIndex = Math.max(0, auctions.length - itemsPerView);
  const canGoBack = currentStartIndex > 0;
  const canGoNext = currentStartIndex < maxStartIndex;
  
  // Lấy auctions cho view hiện tại với smooth transition
  const getCurrentViewAuctions = () => {
    // Trả về tất cả auctions để có thể animate, nhưng chỉ hiển thị phần cần thiết
    return auctions;
  };

  // Tính toán offset cho transform
  const getTransformOffset = () => {
    const cardWidthPercentage = 8.7; // Mỗi card chiếm 20% (100% / 5 cards)
    const gapPercentage = 1.5; // Gap giữa các cards
    return -(currentStartIndex * (cardWidthPercentage + gapPercentage));
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentStartIndex(Math.max(0, currentStartIndex - scrollStep));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStartIndex(Math.min(maxStartIndex, currentStartIndex + scrollStep));
    }
  };

  useEffect(() => {
    const fetchAuctionsWithImages = async () => {
      const cacheKey = `${limit}`;
      
      // Kiểm tra cache trước
      if (cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        setAuctions(cachedData);
        setLoading(false);
        setCurrentStartIndex(0);
        return;
      }

      // Hủy request trước đó nếu có
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }

      // Tạo AbortController mới
      const abortController = new AbortController();
      currentRequestRef.current = abortController;

      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch auctions từ MySQL
        let response;
        if (type === 'ending-soon') {
          response = await auctionApi.getEndingSoonAuctions(limit, abortController.signal);
        } else if (type === 'featured') {
          response = await auctionApi.getFeaturedAuctions(limit, abortController.signal);
        } else if (type === 'newest') {
          response = await auctionApi.getNewestAuctions(limit, abortController.signal);
        }

        // Kiểm tra abort sau mỗi API call
        if (abortController.signal.aborted) return;
        
        const auctions = response.data.auctions;

        // 2. Lấy danh sách UID để fetch images và reviews
        const uids = auctions
          .map(auction => auction.ProductUID)
          .filter(id => id); // Loại bỏ null/undefined

        if (uids.length > 0) {
          // 3. Fetch images từ MongoDB batch bằng UID
          let imageMap = {};
          const imageResponse = await imageApi.getBatchImages(uids, abortController.signal);
          
          // Kiểm tra abort sau khi fetch images
          if (abortController.signal.aborted) return;

          if (imageResponse.success) {
            imageMap = imageResponse.data.imagesMapByUID;
          } else {
            console.warn('Failed to fetch images from MongoDB');
          }

          // 4. Fetch reviews từ MongoDB batch bằng UID
          let reviewsMap = {};
          const reviewsResponse = await reviewApi.getBatchReviews(uids, abortController.signal);
          
          // Kiểm tra abort sau khi fetch reviews
          if (abortController.signal.aborted) return;

          if (reviewsResponse.success) {
            reviewsMap = reviewsResponse.data.reviewsMapByUID;
          } else {
            console.warn('Failed to fetch reviews from MongoDB');
          }

          // 5. Gắn imageUrl và totalReviews vào auctions
          const auctionsWithImagesAndReviews = auctions.map(auction => ({
            ...auction,
            mongoImageUrl: auction.ProductUID ? imageMap[auction.ProductUID] : null,
            totalReviews: auction.ProductUID ? reviewsMap[auction.ProductUID] : null
          }));

          // Lưu vào cache
          cacheRef.current.set(cacheKey, auctionsWithImagesAndReviews);
          setAuctions(auctionsWithImagesAndReviews);
        } else {
          // Lưu vào cache
          cacheRef.current.set(cacheKey, auctions);
          setAuctions(auctions);
        }
        
        setCurrentStartIndex(0); // Reset về đầu khi load dữ liệu mới

      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Request was aborted');
          return;
        }
        console.error('Error fetching auctions:', err);
        setError(err.message);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAuctionsWithImages();

    // Cleanup function
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, [type, limit]);

  if (loading) {
    return (
      <section className="content-auction-section">
        <h2>{title}</h2>
        <div className="loading-container">
          <p>Đang tải dữ liệu...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-auction-section">
      <div className="auction-section-header">
        <h2>{title}</h2>
        <div className="auction-section-arrows">
          <button className={`arrow-btn ${canGoBack ? 'enabled' : 'disabled'}`}
              onClick={handlePrevious}>
            <img 
              src={canGoBack ? chevronLeftBlackIcon : chevronLeftGrayIcon} 
              alt="Previous" 

            />
          </button>

          <button className={`arrow-btn ${canGoNext ? 'enabled' : 'disabled'}`}
              onClick={handleNext}>
            <img 
              src={canGoNext ? chevronRightBlackIcon : chevronRightGrayIcon} 
              alt="Next" 
            />
          </button>
        </div>
      </div>

      <div className="auction-card-container">
        <div 
          className="auction-card-slider"
          style={{
            transform: `translateX(${getTransformOffset()}%)`,
            transition: 'transform 0.5s ease-in-out'
          }}
        >
          {getCurrentViewAuctions().map((auction) => (
            <AuctionCard key={auction.AuctionID} auction={auction} />
          ))}
        </div>
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function để tránh re-render không cần thiết
  return (
    prevProps.title === nextProps.title &&
    prevProps.provinceCode === nextProps.provinceCode &&
    prevProps.limit === nextProps.limit
  );
});

export default AuctionSection;