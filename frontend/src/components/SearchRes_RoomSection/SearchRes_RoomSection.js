import React, { useState, useEffect, useRef } from 'react';
import { useSearchCache } from '../../contexts/SearchCacheContext';
import { imageApi } from '../../api/imageApi';
import { reviewApi } from '../../api/reviewApi';
import RoomCard from '../RoomCard/RoomCard';
import './SearchRes_RoomSection.css';
import FavoritesApi from '../../api/favoritesApi';

const SearchRes_RoomSection = ({ topRatedProducts, durationDays, currentFilters = {} }) => {
  const currentRequestRef = useRef(null);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const { 
    getCachedData, 
    setCachedData, 
    hasCachedData, 
    generateRoomCacheKey 
  } = useSearchCache();

  useEffect(() => {
      const fetchProductsWithImages = async () => {
        // Nếu không có products để fetch, set state và return
        if (!topRatedProducts || topRatedProducts.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const cacheKey = generateRoomCacheKey(topRatedProducts, currentFilters);
        
        // Kiểm tra cache trước
        if (cacheKey && hasCachedData(cacheKey)) {
          const cachedData = getCachedData(cacheKey);
          setProducts(cachedData);
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
          const uids = topRatedProducts
            .map(topRatedProduct => topRatedProduct.UID)
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
  
            // 5. Gắn imageUrl và totalReviews vào topRatedProducts
            const productsWithImagesAndReviews = topRatedProducts.map(product => ({
              ...product,
              mongoImageUrl: product.UID ? imageMap[product.UID] : null,
              totalReviews: product.UID ? reviewsMap[product.UID] : null
            }));
  
            // Lưu vào cache
            if (cacheKey) {
              setCachedData(cacheKey, productsWithImagesAndReviews);
            }
            setProducts(productsWithImagesAndReviews);
          } else {
            // Không có UID để fetch, sử dụng trực tiếp topRatedProducts
            setProducts(topRatedProducts);
            // Lưu vào cache
            if (cacheKey) {
              setCachedData(cacheKey, topRatedProducts);
            }
          }
  
        } catch (err) {
          if (err.name === 'AbortError') {
            console.log('Request was aborted');
            return;
          }
          console.error('Error fetching products:', err);
          setError(err.message);
        } finally {
          if (!abortController.signal.aborted) {
            setLoading(false);
          }
        }
      };
  
      fetchProductsWithImages();
  
      // Cleanup function
      return () => {
        if (currentRequestRef.current) {
          currentRequestRef.current.abort();
        }
      };
    }, [topRatedProducts, currentFilters]);

    useEffect(() => {
      // Chỉ gọi getUserFavorites nếu đã đăng nhập
      const userData = sessionStorage.getItem('userData');
        if (userData) {
          FavoritesApi.getUserFavorites().then(data => {
            setFavoriteIds((data.favorites || []).map(f => f.UID));
          }).catch(() => setFavoriteIds([]));
        } else {
          setFavoriteIds([]);
        }
    }, []);
  
    if (loading) {
      return (
        <section className="search-res-content-room-section">
          <div className="search-res-loading-container">
            <p>Đang tải dữ liệu...</p>
          </div>
        </section>
      );
    }

    if (error) {
      return (
        <section className="search-res-content-room-section">
          <div className="search-res-error-container">
            <p>Có lỗi xảy ra khi tải dữ liệu: {error}</p>
          </div>
        </section>
      );
    }

  return (
    <section className="search-res-content-room-section">
      <div className="search-res-room-card-container">
        {(products || []).map((product, idx) => (
          <RoomCard isFavorite={favoriteIds.includes(product.UID)} key={product.ProductID || idx} product={product} durationDays={durationDays} />
        ))}
      </div>
    </section>
  );
};

export default SearchRes_RoomSection;