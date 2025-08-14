import React from 'react';
import './ImageGallery.css';

const ImageGallery = ({ images }) => {
    return (
        <div className="image-gallery-container">
            <div className="main-image">
                <img src={images.main} alt="Main room view" />
            </div>
            <div className="thumbnail-grid">
                {images.thumbnails.map((thumb, index) => (
                    <img key={index} src={thumb} alt={`Thumbnail ${index + 1}`} />
                ))}
                <div className="more-photos">
                    + {images.moreCount} photos
                </div>
            </div>
        </div>
    );
};

export default ImageGallery;