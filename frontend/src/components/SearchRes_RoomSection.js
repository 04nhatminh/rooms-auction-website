import React, { useState, useEffect, useRef } from 'react';
import RoomCard from './RoomCard';
import './SearchRes_RoomSection.css';

const SearchRes_RoomSection = ({ topRatedProducts }) => {
  const cacheRef = React.useRef(new Map());
  const currentRequestRef = useRef(null);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchProductsWithImages = async () => {
        const cacheArray = (topRatedProducts || []).map(product => product.ProductID);
        
        // Kiểm tra cache trước
        if (cacheRef.current.has(cacheArray)) {
          const cachedData = cacheRef.current.get(cacheArray);
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
          
          // 1. Lấy danh sách ProductID để fetch images và reviews
          const productIds = topRatedProducts
            .map(topRatedProduct => topRatedProduct.ProductID)
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
            const productsWithImagesAndReviews = topRatedProducts.map(topRatedProduct => ({
              ...topRatedProduct,
              mongoImageUrl: topRatedProduct.ProductID ? imageMap[topRatedProduct.ProductID] : null,
              totalReviews: topRatedProduct.ProductID ? reviewsMap[topRatedProduct.ProductID] : null
            }));
  
            // Lưu vào cache
            cacheRef.current.set(cacheArray, productsWithImagesAndReviews);
            setProducts(productsWithImagesAndReviews);
          } else {
            // Lưu vào cache
            cacheRef.current.set(cacheArray, topRatedProducts);
            setProducts(topRatedProducts);
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
    }, [topRatedProducts]);
  
    if (loading) {
      return (
        <section className="search-res-content-room-section">
          <div className="search-res-loading-container">
            <p>Đang tải dữ liệu...</p>
          </div>
        </section>
      );
    }

  return (
    <section className="search-res-content-room-section">
      <div className="search-res-room-card-container">
        {(topRatedProducts || []).map((product, idx) => (
          <RoomCard key={product.ProductID || idx} product={product} />
        ))}
      </div>
    </section>
  );
};

export default SearchRes_RoomSection;