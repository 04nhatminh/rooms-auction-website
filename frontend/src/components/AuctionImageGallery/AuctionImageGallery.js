import React from 'react';
import './AuctionImageGallery.css';

const AuctionImageGallery = ({ images }) => {
    return (
        <div className="auction-image-gallery">
            <div className="auction-main-image">
                <img src={images.main} alt="Main room view" />
            </div>
            <div className="auction-thumbnail-grid">
                {images.thumbnails.map((thumb, index) => (
                    <img key={index} src={thumb} alt={`Thumbnail ${index + 1}`} />
                ))}
            </div>
        </div>
    );
};

export default AuctionImageGallery;