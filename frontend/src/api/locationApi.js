const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

class LocationAPI {
  static getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  // Lấy top locations phổ biến để preload
  static async getPopularLocations(limit = 20, signal = null) {
    const res = await fetch(`${API_BASE_URL}/api/locations/popular?limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch popular locations');
    return res.json();
  }

  // Search locations (provinces + districts)
  static async searchLocations(searchTerm, limit = 20, signal = null) {
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
      headers: this.getHeaders(),
      signal
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to search locations');
    return res.json();
  }

  // Lấy tất cả provinces
  static async getAllProvinces(signal = null) {
    const res = await fetch(`${API_BASE_URL}/api/locations/provinces`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch all provinces');
    return res.json();
  }

  // Lấy tất cả districts
  static async getAllDistricts(signal = null) {
    const res = await fetch(`${API_BASE_URL}/api/locations/districts`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch all districts');
    return res.json();
  }

  // Lấy chi tiết province theo code
  static async getProvinceDetails(provinceCode, signal = null) {
    const res = await fetch(`${API_BASE_URL}/api/locations/provinces/${provinceCode}`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch province details');
    return res.json();
  }

  // Lấy chi tiết district theo code
  static async getDistrictDetails(districtCode, signal = null) {
    const res = await fetch(`${API_BASE_URL}/api/locations/districts/${districtCode}`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch district details');
    return res.json();
  }

  // Lấy latitude, longitude từ geocode
  static async geocodeAddress(q) {
    const res = await fetch(`${API_BASE_URL}/api/geocode?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (json.success && json.found) {
      return { lat: json.lat, lng: json.lng, label: json.display_name || q };
    } else {
      return { lat: null, lng: null, label: q };
    }
  }
}

export default LocationAPI;
