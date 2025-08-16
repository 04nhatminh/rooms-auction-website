const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const WishlistApi = {
    async getUserWishlist() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi tải danh sách xem sau');
        }
        return data;
    },
    async addWishlist(productId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi thêm vào xem sau');
        }
        return data;
    },
    async removeWishlist(productId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/wishlist/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi xóa khỏi xem sau');
        }
        return data;
    }
};

export default WishlistApi;
