import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FavoritesApi from '../../api/favoritesApi';
import { imageApi } from '../../api/imageApi';
import HeaderSimple from '../../components/HeaderSimple/HeaderSimple';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const FavoritePage = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Lấy danh sách yêu thích
            const data = await FavoritesApi.getUserFavorites();
            const favorites = data.favorites || [];

            // Lấy danh sách UID
            const uids = favorites.map(item => item.UID).filter(Boolean);

            // Gọi batch API lấy ảnh
            let imageMap = {};
            if (uids.length > 0) {
                const imageRes = await imageApi.getBatchImages(uids);
                if (imageRes.success) {
                    imageMap = imageRes.data.imagesMapByUID || {};
                }
            }

            // Gắn ảnh vào từng item
            const favoritesWithImages = favorites.map(item => ({
                ...item,
                MainImageURL: imageMap[item.UID] || null
            }));

            setFavorites(favoritesWithImages);
        } catch (err) {
            setError(err.message);
            // Nếu unauthorized, redirect về login
            if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (uid, productName) => {
        if (!window.confirm(`Bạn có muốn bỏ yêu thích "${productName}"?`)) {
            return;
        }

        try {
            await FavoritesApi.removeFavorite(uid);
            // Cập nhật state local
            setFavorites(prev => prev.filter(item => item.UID !== uid));
            alert('Đã bỏ yêu thích thành công!');
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleViewProduct = (uid) => {
        navigate(`/room/${uid}`);
    };

    return React.createElement('div', { className: "min-h-dvh bg-slate-100" },
        // Header
        React.createElement(HeaderSimple),

        // Main Content
        React.createElement('main', { className: "mx-auto max-w-6xl px-4 py-6" },
            React.createElement('div', { className: "flex items-center justify-between mb-6" },
                React.createElement('h1', { className: "text-2xl font-semibold" }, "Danh sách yêu thích của bạn"),
                React.createElement('button', {
                    onClick: () => navigate('/'),
                    className: "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                }, "← Trang chủ")
            ),

            // Loading State
            loading && React.createElement('div', { className: "flex justify-center items-center py-12" },
                React.createElement('div', { className: "text-slate-500" }, "Đang tải danh sách yêu thích...")
            ),

            // Error State
            error && React.createElement('div', { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6" },
                React.createElement('div', { className: "text-red-800 text-sm" }, error),
                React.createElement('button', {
                    onClick: loadFavorites,
                    className: "mt-2 text-red-600 text-sm hover:text-red-800 underline"
                }, "Thử lại")
            ),

            // Empty State
            !loading && !error && favorites.length === 0 && React.createElement('div', { className: "text-center py-12" },
                React.createElement('div', { className: "text-slate-500 mb-4" },
                    React.createElement('i', { className: "fa-regular fa-heart text-4xl mb-4 block" }),
                    "Chưa có sản phẩm yêu thích nào"
                ),
                React.createElement('button', {
                    onClick: () => navigate('/'),
                    className: "inline-flex items-center gap-2 bg-[#278C9F] text-white px-4 py-2 rounded-lg hover:bg-[#1f6d7c] transition-colors"
                }, "Khám phá sản phẩm")
            ),

            // Favorites Grid
            !loading && !error && favorites.length > 0 && React.createElement('div', { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
                favorites.map(item => {
                    const id = item.ProductID;
                    const uid = item.UID; // fallback nếu không có UID
                    const name = item.ProductName || '—';
                    const imageUrl = item.MainImageURL || null; // Sử dụng ảnh từ API
                    const price = item.Price;
                    const rating = item.AvgRating || 5.0;
                    const location = item.ProvinceName || '—';
                    
                    return React.createElement('div', { 
                        key: uid, // Sử dụng UID làm key nếu có
                        className: "rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    },
                        // Image Container
                        React.createElement('div', { className: "relative aspect-[4/3] bg-slate-200 overflow-hidden" },
                            imageUrl ? React.createElement('img', {
                                src: imageUrl,
                                alt: name,
                                className: "h-full w-full object-cover transition-transform duration-300 hover:scale-105",
                                loading: "lazy"
                            }) : React.createElement('div', { className: "flex h-full w-full items-center justify-center text-slate-400 text-xs" },
                                React.createElement('i', { className: "fa-regular fa-image text-2xl" }),
                                React.createElement('div', { className: "ml-2" }, "Không có hình ảnh")
                            ),
                            
                            // Remove Heart Button
                            React.createElement('button', {
                                className: "absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur p-2 text-rose-600 border border-white shadow-sm hover:bg-white transition-colors",
                                title: "Bỏ yêu thích",
                                onClick: () => handleRemoveFavorite(id, name)
                            }, React.createElement('i', { className: "fa-solid fa-heart text-sm" }))
                        ),

                        // Content
                        React.createElement('div', { className: "p-4 flex flex-col gap-2 flex-1" },
                            React.createElement('h3', { className: "text-sm font-semibold line-clamp-2 leading-5" }, name),
                            
                            React.createElement('div', { className: "text-xs text-slate-500 flex items-center gap-1" },
                                React.createElement('i', { className: "fa-solid fa-location-dot" }),
                                location
                            ),
                            
                            React.createElement('div', { className: "flex items-center gap-2 text-xs" },
                                React.createElement('span', { className: "flex items-center gap-1 font-medium" },
                                    React.createElement('i', { className: "fa-solid fa-star text-amber-400" }),
                                    Number(rating).toFixed(1)
                                )
                            ),
                            
                            price && React.createElement('div', { className: "text-sm font-semibold text-slate-900" },
                                Number(price).toLocaleString('vi-VN') + ' đ'
                            ),
                            
                            React.createElement('button', {
                                className: "mt-auto w-full text-xs font-medium rounded-lg border border-slate-300 py-2 hover:bg-slate-50 transition-colors",
                                onClick: () => handleViewProduct(uid)
                            }, "Xem chi tiết")
                        )
                    );
                })
            )
        )
    );
};

export default FavoritePage;