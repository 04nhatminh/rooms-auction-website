// src/pages/SearchResult/SearchResult.js
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import Header from '../../components/Header/Header';
import SearchRes_RoomSection from '../../components/SearchRes_RoomSection/SearchRes_RoomSection';
import Footer from '../../components/Footer/Footer';
import './SearchResult.css';

const LIMIT = 20;

const SearchResult = () => {
  const location = useLocation();
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [durationDays, setDurationDays] = useState(1); // Mặc định là 1 ngày
  const abortRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    //   const params = {
    //   location: urlParams.get('location'),
    //   locationId: urlParams.get('locationId'),
    //   type: urlParams.get('type'),
    //   checkinDate: urlParams.get('checkinDate'),
    //   checkoutDate: urlParams.get('checkoutDate'),
    //   numAdults: urlParams.get('numAdults'),
    //   numChildren: urlParams.get('numChildren'),
    //   numInfants: urlParams.get('numInfants')
    // };
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

    // Không có locationId => clear danh sách
    if (!locationId) {
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
        let resp;
        if (type === 'district') {
          resp = await productApi.getTopRatedProductsByDistrict(locationId, LIMIT, controller.signal);
        } else {
          // Mặc định coi là province
          resp = await productApi.getTopRatedProducts(locationId, LIMIT, controller.signal);
        }

        const products = resp?.data?.products;
        setTopRatedProducts(Array.isArray(products) ? products : []);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Fetch search results failed:', err);
          setTopRatedProducts([]);
        }
      }
    })();

    // Cleanup: hủy request khi unmount / đổi query
    return () => controller.abort();
  }, [location.search]);

  return (
    <>
      <Header />
      <SearchRes_RoomSection topRatedProducts={topRatedProducts} durationDays={durationDays} />
      <Footer />
    </>
  );
};

export default SearchResult;
