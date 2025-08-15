const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

class LocationAPI {
  static getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  // Lấy top locations phổ biến để preload
  static async getPopularLocations(limit = 20) {
    const res = await fetch(`${API_BASE_URL}/api/locations/popular?limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch popular locations');
    return res.json();
  }

  // Search locations (provinces + districts)
  static async searchLocations(searchTerm, limit = 20) {
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

    const res = await fetch(`${API_BASE_URL}/api/locations/search?${params}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to search locations');
    return res.json();
  }

  // Lấy chi tiết province theo code
  static async getProvinceDetails(provinceCode) {
    const res = await fetch(`${API_BASE_URL}/api/locations/provinces/${provinceCode}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch province details');
    return res.json();
  }

  // Lấy chi tiết district theo code
  static async getDistrictDetails(districtCode) {
    const res = await fetch(`${API_BASE_URL}/api/locations/districts/${districtCode}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch district details');
    return res.json();
  }
}

export default LocationAPI;
