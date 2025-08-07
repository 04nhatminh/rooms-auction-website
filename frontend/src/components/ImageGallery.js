import React from 'react';
import './ImageGallery.css';
import dotsMenuIcon from '../assets/dots_menu.png';

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
      <button className="show-all-photos">
        <img src={dotsMenuIcon} alt="Hiển thị tất cả ảnh" />
        Hiển thị tất cả ảnh
      </button>
    </div>
  );
};

export default ImageGallery;