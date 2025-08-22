import React, { useState, useRef, useEffect } from 'react';
import { useProduct } from '../../contexts/ProductContext';
import './RoomTitle.css';
import shareIcon from '../../assets/share.png';
import favoriteIcon from '../../assets/favorite.png';
import favoriteFilledIcon from '../../assets/favorite_filled.png';
import saveIcon from '../../assets/save.png';
import WishlistApi from '../../api/wishlistApi';

const RoomTitle = ({ onSave, wishlistChanged }) => {
  const { data } = useProduct();
  const [showShare, setShowShare] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const shareRef = useRef(null);
  const shareLink = window.location.href;
  const UID = data?.details?.UID;
  const ProductID = data?.details?.ProductID;
  // Lấy trạng thái yêu thích ban đầu
  useEffect(() => {
    async function fetchFavorite() {
      try {
        setLoadingFavorite(true);
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}/favorite`,
          {
            method: 'GET',
            credentials: 'include', // gửi cookie lên backend
            headers: { 'Content-Type': 'application/json' }
          }
        );
        const dataRes = await res.json();
        if (res.ok && dataRes.favorites) {
          setIsFavorite(dataRes.favorites.some(f => f.UID === UID));
        }
      } catch (e) {
        setIsFavorite(false);
      } finally {
        setLoadingFavorite(false);
      }
    }
    if (UID) fetchFavorite();
  }, [UID]);

  // Kiểm tra trạng thái wishlist
  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await WishlistApi.getUserWishlist();
        setIsWishlisted(res.wishlist.some(w => w.UID === UID));
      } catch (e) {
        setIsWishlisted(false);
      }
    }
    if (UID) fetchWishlist();
  }, [UID, wishlistChanged]);

  // Xử lý toggle yêu thích
  const handleToggleFavorite = async () => {
    if (!UID) return;
    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        await import('../../api/favoritesApi').then(api => api.default.removeFavorite(UID));
        setIsFavorite(false);
      } else {
        await import('../../api/favoritesApi').then(api => api.default.addFavorite(UID));
        setIsFavorite(true);
      }
    } catch (e) {
      alert('Lỗi thao tác yêu thích: ' + (e.message || ''));
    } finally {
      setLoadingFavorite(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!UID) return;
    setLoadingWishlist(true);
    try {
      if (isWishlisted) {
        await WishlistApi.removeWishlist(UID);
        setIsWishlisted(false);
      } else {
        await WishlistApi.addWishlist(UID);
        setIsWishlisted(true);
      }
    } catch (e) {
      alert('Lỗi thao tác xem sau: ' + (e.message || ''));
    } finally {
      setLoadingWishlist(false);
    }
  };

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
            <button className="action-btn" onClick={handleToggleFavorite} disabled={loadingFavorite}>
              <img src={isFavorite ? favoriteFilledIcon : favoriteIcon} alt={isFavorite ? 'Đã yêu thích' : 'Yêu thích'} className="action-icon" />
              {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
            </button>
        <button
          className="action-btn"
          onClick={async () => {
            if (!isWishlisted) {
              try {
                const res = await import('../../api/wishlistApi');
                await res.default.addWishlist(UID);
                setIsWishlisted(true);
                if (onSave) onSave();
                alert('Đã thêm vào Xem sau');
              } catch (e) {
                alert('Lỗi thêm vào Xem sau: ' + (e.message || ''));
              }
            }
          }}
          disabled={isWishlisted}
        >
          <img
            src={saveIcon}
            alt="Save"
            className="action-icon"
            style={isWishlisted ? { filter: 'brightness(0) saturate(100%) invert(41%) sepia(99%) saturate(749%) hue-rotate(140deg) brightness(97%) contrast(101%)' } : {}}
          />
          {isWishlisted ? 'Đã lưu' : 'Xem sau'}
        </button>
      </div>
    </div>
  );
};

export default RoomTitle;