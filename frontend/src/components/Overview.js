import React from 'react';
import './Overview.css';
import starIcon from '../assets/star_filled.png';
import { useProduct } from '../contexts/ProductContext';

const getName = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object') {
    if (typeof v.Name === 'string') return v.Name.trim();      // MySQL alias
    if (typeof v.name === 'string') return v.name.trim();      // other sources
  }
  return '';
};

const Overview = () => {
  const { data } = useProduct();
  const propertyName = getName(data?.propertyName);
  const district = getName(data?.districtName);
  const province = getName(data?.provinceName);

  const location = [district, province, 'Việt Nam'].filter(Boolean).join(', ');

  const overview = [propertyName, 'tại',location]
  .filter(Boolean)
  .join(' ');

  return (
    <div className="overview">
      <h2>{overview}</h2>
      <p className="room-details">{data?.details?.NumBedrooms || 0} phòng ngủ - {data?.details?.NumBeds || 0} giường - {data?.details?.NumBathrooms || 0} phòng tắm</p>
      <p className="rating">
        <img src={starIcon} alt="Star" className="star-icon" />
        <span className="rating-score">{data?.averageRating || 0}</span>
        <span>-</span>
        <span className="rating-count">{data?.reviews?.total_reviews || 0} đánh giá</span>
      </p>
    </div>
  );
};

export default Overview;