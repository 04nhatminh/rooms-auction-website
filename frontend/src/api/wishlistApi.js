const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const WishlistApi = {
    async getUserWishlist() {
        const response = await fetch(`${API_BASE_URL}/wishlist`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi tải danh sách xem sau');
        }
        return data;
    },
    async addWishlist(uid) {
        const response = await fetch(`${API_BASE_URL}/wishlist/${uid}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi thêm vào xem sau');
        }
        return data;
    },
    async removeWishlist(uid) {
        const response = await fetch(`${API_BASE_URL}/wishlist/${uid}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi xóa khỏi xem sau');
        }
        return data;
    }
};

export default WishlistApi;
