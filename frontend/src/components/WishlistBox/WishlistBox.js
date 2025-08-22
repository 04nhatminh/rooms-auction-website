import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WishlistBox.css';
import WishlistApi from '../../api/wishlistApi';

const WishlistBox = ({ newWishlistItem, onRemove }) => {
  const handleRemoveAll = async () => {
    if (wishlist.length === 0) return;
    if (!window.confirm('Bạn có chắc muốn xóa tất cả phòng khỏi Xem Sau?')) return;
    try {
      for (const item of wishlist) {
        await WishlistApi.removeWishlist(item.ProductID);
      }
      await fetchWishlist();
      if (onRemove) onRemove();
    } catch (e) {
      alert('Lỗi xóa tất cả khỏi xem sau');
    }
  };
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist từ API khi mount
  const fetchWishlist = async () => {
    try {
      const res = await WishlistApi.getUserWishlist();
      setWishlist(res.wishlist || []);
    } catch (e) {
      setWishlist([]);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // Thêm phòng mới vào wishlist khi có newWishlistItem
  useEffect(() => {
    async function addToWishlist() {
      if (newWishlistItem && newWishlistItem.ProductID) {
        try {
          await WishlistApi.addWishlist(newWishlistItem.ProductID);
          await fetchWishlist();
        } catch (e) {
          alert('Lỗi thêm vào xem sau');
        }
      }
    }
    addToWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newWishlistItem]);

  const handleRemove = async (productId) => {
    try {
      await WishlistApi.removeWishlist(productId);
      await fetchWishlist();
      if (onRemove) onRemove();
    } catch (e) {
      alert('Lỗi xóa khỏi xem sau');
    }
  };

  return (
    <div className={`wishlist-box${open ? ' open' : ''}`}>
      <button className="wishlist-toggle" onClick={() => setOpen(v => !v)}>
        {open ? 'Ẩn Xem Sau' : 'Xem Sau'}
      </button>
      {open && (
        <div className="wishlist-content">
          <h3>Danh sách Xem Sau</h3>
          {wishlist.length > 0 && (
            <button className="wishlist-remove-all" onClick={handleRemoveAll} style={{ marginBottom: 8, color: 'red', fontWeight: 'bold' }}>
              Xóa tất cả
            </button>
          )}
          {wishlist.length === 0 ? (
            <div className="wishlist-empty">Chưa có phòng nào được lưu.</div>
          ) : (
            <ul className="wishlist-list">
              {wishlist.map(item => (
                <li
                  key={item.ProductID}
                  className="wishlist-item"
                  style={{ cursor: 'pointer' }}
                  onClick={e => {
                    // Chỉ navigate khi không bấm nút Xóa
                    if (e.target.className !== 'wishlist-remove') {
                      navigate(`/room/${item.UID}`);
                    }
                  }}
                >
                  <span className="wishlist-name">{item.ProductName || 'Không có tên'}</span>
                  <span className="wishlist-location">{item.ProvinceName || 'Không có địa điểm'}</span>
                  <span className="wishlist-price">{item.Price ? Number(item.Price).toLocaleString('vi-VN') + ' đ' : '—'}</span>
                  <button className="wishlist-remove" onClick={e => { e.stopPropagation(); handleRemove(item.ProductID); }}>Xóa</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistBox;
