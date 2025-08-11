const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

class LocationAPI {
  /**
   * Lấy suggestions khi search location
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @param {number} limit - Giới hạn số kết quả
   */
  static async getLocationSuggestions(searchTerm, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }
      params.append('limit', limit);

      const response = await fetch(`http://localhost:3000/api/locations/suggestions?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      throw error;
    }
  }

  /**
   * Lấy top locations phổ biến để preload
   * @param {number} limit - Số lượng locations
   */
  static async getPopularLocations(limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/popular?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching popular locations:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả provinces với products
   */
  static async getProvincesWithProducts(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations/provinces/with-products?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching provinces with products:', error);
      throw error;
    }
  }

  /**
   * Search locations (provinces + districts)
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @param {number} limit - Giới hạn kết quả
   */
  static async searchLocations(searchTerm, limit = 20) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: true,
          data: {
            searchTerm: searchTerm || '',
            suggestions: []
          }
        };
      }

      const params = new URLSearchParams({
        q: searchTerm.trim(),
        limit: limit
      });

      const response = await fetch(`${API_BASE_URL}/api/locations/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }
}

export default LocationAPI;
