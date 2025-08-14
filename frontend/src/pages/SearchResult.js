import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LocationAPI from '../api/locationApi';
import './SearchResult.css';
import Header from '../components/Header';
import SearchRes_RoomSection from '../components/SearchRes_RoomSection';
import Footer from '../components/Footer';

const SearchResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useState({});
  const [locationInfo, setLocationInfo] = useState(null);
  const [topRatedProducts, setTopRatedProducts] = useState([]);

  useEffect(() => {
    // Lấy parameters từ URL
    const urlParams = new URLSearchParams(location.search);
    const params = {
      location: urlParams.get('location'),
      locationId: urlParams.get('locationId'),
      type: urlParams.get('type'),
      checkinDate: urlParams.get('checkinDate'),
      checkoutDate: urlParams.get('checkoutDate'),
      numAdults: urlParams.get('numAdults'),
      numChildren: urlParams.get('numChildren'),
      numInfants: urlParams.get('numInfants')
    };
    setSearchParams(params);
    console.log('LocationId:', params.locationId);

    // Gọi API lấy top-rated products nếu có locationId
    let api = "";
    if (params.locationId && typeof params.locationId === "string") {
      if (params.type == "province")
        api = `http://localhost:3000/api/products/top-rated?provinceCode=${params.locationId}&limit=20`;
      else if (params.type == "district")
        api = `http://localhost:3000/api/products/district/top-rated?districtCode=${params.locationId}&limit=20`;
      fetch(api)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data?.products)) {
            setTopRatedProducts(data.data.products);
          } else {
            setTopRatedProducts([]);
          }
        })
        .catch(() => setTopRatedProducts([]));
    } else {
      setTopRatedProducts([]);
    }
  }, [location.search]);

  return (
    <>
      <Header />
      <SearchRes_RoomSection topRatedProducts={topRatedProducts} />
      <Footer />
    </>
  );
};

export default SearchResult;