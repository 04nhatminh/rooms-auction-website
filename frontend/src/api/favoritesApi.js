const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const FavoritesApi = {
    // Lấy danh sách yêu thích
    async getUserFavorites() {
        const response = await fetch(`${API_BASE_URL}/favorite`, {
            method: 'GET',
            credentials: 'include', // gửi cookie lên backend
            headers: { 'Accept': 'application/json' },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi tải danh sách yêu thích');
        }
        return data;
    },

    // Xóa khỏi yêu thích
    async removeFavorite(uid) {
        const response = await fetch(`${API_BASE_URL}/favorite/${uid}`, {
            method: 'DELETE',
            credentials: 'include', // gửi cookie lên backend
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi xóa yêu thích');
        }
        return data;
    },

    // Thêm vào yêu thích
    async addFavorite(uid) {
        const response = await fetch(`${API_BASE_URL}/favorite/${uid}`, {
            method: 'POST',
            credentials: 'include', // gửi cookie lên backend
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Lỗi thêm yêu thích');
        }
        return data;
    }
};

export default FavoritesApi;