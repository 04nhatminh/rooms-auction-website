import React from 'react';
import './ImageGallery.css';
import shareIcon from '../assets/share.png';
import heartIcon from '../assets/heart.png';
import saveIcon from '../assets/save.png';

const ImageGallery = () => {
  return (
    <div className="image-gallery">
      <div className="gallery-layout">
        <div className="main-image"></div>
        <div className="side-images">
          <div className="side-image"></div>
          <div className="side-image"></div>
          <div className="side-image"></div>
          <div className="side-image"></div>
        </div>
      </div>
      <button className="show-all-photos">Hiển thị tất cả ảnh</button>
    </div>
  );
};

export default ImageGallery;