import React, { useState, useEffect, useRef, memo } from 'react';
import RoomCard from './RoomCard';
import './RoomSection.css';
import chevronLeftGrayIcon from '../assets/chevron_left_gray.png';
import chevronRightGrayIcon from '../assets/chevron_right_gray.png';
import chevronLeftBlackIcon from '../assets/chevron_left_black.png';
import chevronRightBlackIcon from '../assets/chevron_right_black.png';

const RoomSection = memo(({ title, provinceCode = '01', limit = 15 }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);
  const [itemsPerView] = useState(5); // Hiển thị 5 items cùng lúc
  const [scrollStep] = useState(2); // Scroll 2 items mỗi lần
  
  // Thêm refs để quản lý cache và request
  const cacheRef = useRef(new Map());
  const currentRequestRef = useRef(null);
  
  // Tính toán pagination
  const maxStartIndex = Math.max(0, products.length - itemsPerView);
  const canGoBack = currentStartIndex > 0;
  const canGoNext = currentStartIndex < maxStartIndex;
  
  // Lấy products cho view hiện tại với smooth transition
  const getCurrentViewProducts = () => {
    // Trả về tất cả products để có thể animate, nhưng chỉ hiển thị phần cần thiết
    return products;
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
    const fetchProductsWithImages = async () => {
      const cacheKey = `${provinceCode}-${limit}`;
      
      // Kiểm tra cache trước
      if (cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        setProducts(cachedData);
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
        
        // 1. Fetch products từ MySQL
        const response = await fetch(
          `http://localhost:3000/api/room/top-rated?provinceCode=${provinceCode}&limit=${limit}`,
          { signal: abortController.signal }
        );
        
        if (abortController.signal.aborted) return;
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to load products');
        }

        const products = data.data.products;
        
        // 2. Lấy danh sách ProductID để fetch images và reviews
        const productIds = products
          .map(product => product.ProductID)
          .filter(id => id); // Loại bỏ null/undefined

        if (productIds.length > 0) {
          // 3. Fetch images từ MongoDB batch bằng ProductID
          const imageResponse = await fetch('http://localhost:3000/api/images/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productIds }),
            signal: abortController.signal
          });

          if (abortController.signal.aborted) return;

          let imageMap = {};

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageMap = imageData.success ? imageData.data.imageMap : {};
          } else {
            console.warn('Failed to fetch images from MongoDB');
          }

          // 4. Fetch reviews từ MongoDB batch bằng ProductID
          let reviewsMap = {};
          if (productIds.length > 0) {
            const reviewsResponse = await fetch('http://localhost:3000/api/reviews/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ productIds }),
              signal: abortController.signal
            });

            if (abortController.signal.aborted) return;

            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              reviewsMap = reviewsData.success ? reviewsData.data.reviewsMap : {};
            } else {
              console.warn('Failed to fetch reviews from MongoDB');
            }
          }

          // 5. Gắn imageUrl và totalReviews vào products
          const productsWithImagesAndReviews = products.map(product => ({
            ...product,
            mongoImageUrl: product.ProductID ? imageMap[product.ProductID] : null,
            totalReviews: product.ProductID ? reviewsMap[product.ProductID] : null
          }));

          // Lưu vào cache
          cacheRef.current.set(cacheKey, productsWithImagesAndReviews);
          setProducts(productsWithImagesAndReviews);
        } else {
          // Lưu vào cache
          cacheRef.current.set(cacheKey, products);
          setProducts(products);
        }
        
        setCurrentStartIndex(0); // Reset về đầu khi load dữ liệu mới

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
  }, [provinceCode, limit]);

  if (loading) {
    return (
      <section className="content-room-section">
        <h2>{title}</h2>
        <div className="loading-container">
          <p>Đang tải dữ liệu...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-room-section">
      <div className="room-section-header">
        <h2>{title}</h2>
        <div className="room-section-arrows">
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

      <div className="room-card-container">
        <div 
          className="room-card-slider"
          style={{
            transform: `translateX(${getTransformOffset()}%)`,
            transition: 'transform 0.5s ease-in-out'
          }}
        >
          {getCurrentViewProducts().map((product) => (
            <RoomCard key={product.ProductID} product={product} />
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

export default RoomSection;