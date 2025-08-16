import React, { useState, useRef, useEffect } from 'react';
import { useProduct } from '../../contexts/ProductContext';
import './RoomTitle.css';
import shareIcon from '../../assets/share.png';
import heartIcon from '../../assets/heart.png';
import saveIcon from '../../assets/save.png';

const RoomTitle = () => {
  const { data } = useProduct();
  const [showShare, setShowShare] = useState(false);
  const shareRef = useRef(null);
  const shareLink = window.location.href;

  useEffect(() => {
    function onDocClick(e) {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShare(false);
      }
    }
    if (showShare) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showShare]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      alert("Sao chép liên kết thành công!");
    } catch (e) {
      window.prompt('Sao chép liên kết này:', shareLink);
    }
  };
  
  return (
    <div className="room-title">
      <h2>{data?.details?.Name}</h2>

      <div className="user-actions">
        <div className="share-wrapper" ref={shareRef}>
          <button className="action-btn" onClick={() => setShowShare(v => !v)}>
            <img src={shareIcon} alt="" className="action-icon" />
            Chia sẻ
          </button>

          {showShare && (
            <div className="share-popup">
              <div className="share-arrow" />
              <input className="share-input" readOnly value={shareLink} />
              
              <button className="copy-btn" onClick={handleCopy}>Sao chép</button>
            </div>
          )}
        </div>

        <button className="action-btn">
          <img src={heartIcon} alt="Favorite" className="action-icon" />
          Yêu thích
        </button>
        <button className="action-btn">
          <img src={saveIcon} alt="Save" className="action-icon" />
          Xem sau
        </button>
      </div>
    </div>
  );
};

export default RoomTitle;