import React, { useState, useEffect, useRef } from 'react';
import AuctionCard from '../AuctionCard/AuctionCard';
import { imageApi } from '../../api/imageApi';
import { reviewApi } from '../../api/reviewApi';
import './SearchRes_AuctionSection.css';

const SearchRes_AuctionSection = ({ activeAuctions }) => {
  const cacheRef = React.useRef(new Map());
  const currentRequestRef = useRef(null);
  const [auctions, setAuctions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchAuctionsWithImages = async () => {
        // Nếu không có auctions để fetch, set state và return
        if (!activeAuctions || activeAuctions.length === 0) {
          setAuctions([]);
          setLoading(false);
          return;
        }

        const cacheArray = activeAuctions.map(auction => auction.AuctionUID);

        // Kiểm tra cache trước
        if (cacheRef.current.has(cacheArray)) {
          const cachedData = cacheRef.current.get(cacheArray);
          setAuctions(cachedData);
          setLoading(false);
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
          // 1. Lấy danh sách UID để fetch images và reviews
          const uids = activeAuctions
            .map(activeAuction => activeAuction.ProductUID)
            .filter(id => id); // Loại bỏ null/undefined

          if (uids.length > 0) {
            // 2. Fetch images từ MongoDB batch bằng UID
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
  
            // 5. Gắn imageUrl và totalReviews vào activeAuction
            const auctionsWithImagesAndReviews = activeAuctions.map(auction => ({
              ...auction,
              mongoImageUrl: auction.ProductUID ? imageMap[auction.ProductUID] : null,
              totalReviews: auction.ProductUID ? reviewsMap[auction.ProductUID] : null
            }));
  
            // Lưu vào cache
            cacheRef.current.set(cacheArray, auctionsWithImagesAndReviews);
            setAuctions(auctionsWithImagesAndReviews);
          } else {
            // Không có UID để fetch, sử dụng trực tiếp activeAuctions
            setAuctions(activeAuctions);
            // Lưu vào cache
            cacheRef.current.set(cacheArray, activeAuctions);
          }
  
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
    }, [activeAuctions]);

    if (loading) {
      return (
        <section className="search-res-content-auction-section">
          <div className="search-res-loading-container">
            <p>Đang tải dữ liệu...</p>
          </div>
        </section>
      );
    }

    if (error) {
      return (
        <section className="search-res-content-auction-section">
          <div className="search-res-error-container">
            <p>Có lỗi xảy ra khi tải dữ liệu: {error}</p>
          </div>
        </section>
      );
    }

  return (
    <section className="search-res-content-auction-section">
      <div className="search-res-auction-card-container">
        {(auctions || []).map((auction, idx) => (
          <AuctionCard key={auction.AuctionUID || idx} auction={auction} />
        ))}
      </div>
    </section>
  );
};

export default SearchRes_AuctionSection;