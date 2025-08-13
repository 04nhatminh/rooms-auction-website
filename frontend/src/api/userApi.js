const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

class UserAPI {
  static getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  static async getProfile() {
    const res = await fetch(`${API_BASE_URL}/user/me`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to load profile');
    return res.json();
  }

  static async updateProfile(payload) {
    const res = await fetch(`${API_BASE_URL}/user/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to update profile');
    return res.json();
  }

  static async changePassword(currentPassword, newPassword) {
    const res = await fetch(`${API_BASE_URL}/user/me/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to change password');
    return res.json();
  }
}

export default UserAPI;
