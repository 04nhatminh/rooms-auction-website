const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const FavoritesApi = {
    // Lấy danh sách yêu thích
    async getUserFavorites() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/favorite`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi tải danh sách yêu thích');
        }
        return data;
    },

    // Xóa khỏi yêu thích
    async removeFavorite(productId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/favorite/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi xóa yêu thích');
        }
        return data;
    },

    // Thêm vào yêu thích
    async addFavorite(productId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/favorite/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi thêm yêu thích');
        }
        return data;
    }
};

export default FavoritesApi;