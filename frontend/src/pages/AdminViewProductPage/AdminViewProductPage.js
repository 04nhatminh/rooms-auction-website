import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import productApi from '../../api/productApi';
import AdminAddProductPage from '../AdminAddProductPage/AdminAddProductPage';

const AdminViewProductPage = () => {
  // Get product ID from URL
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  // Fetch full product data by ID
  const fetchFullProductDataByProductId = async (productId) => {
      try {
          const productData = await productApi.getFullProductDataByProductId(productId);
          console.log('Fetched product data:', productData);
          setProduct(productData);
      } catch (error) {
          console.error('Error fetching product data:', error);
      }
  };

  useEffect(() => {
    if (id) {
        fetchFullProductDataByProductId(id);
    }
  }, [id]);
  
  return (
    <AdminAddProductPage 
      type="view" 
      product={product}
    />
  );
};

export default AdminViewProductPage;
