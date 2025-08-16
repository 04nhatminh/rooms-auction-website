const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const ADMIN_PREFIX = '/admin';

class UserApi {
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

  static async getUsers(token, page = 1, limit = 10) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const msg = await UserApi.Message(res);
      throw new Error(msg || 'Không thể lấy danh sách người dùng.');
    }
    return res.json();
  };

  static async deleteUser(token, id) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const msg = await UserApi.safeMessage(res);
      throw new Error(msg || 'Không thể xóa người dùng.');
    }
    return res.json();
  };

  // helper để đọc message lỗi nếu backend trả JSON/text
  static async safeMessage(res) {
    try {
      const text = await res.text();
      try { return JSON.parse(text)?.message || text; } catch { return text; }
    } catch { return null; }
  }

  static async getUserById(token, id) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text() || 'Không thể lấy thông tin người dùng.');
    return res.json();
  };

  static async updateUserStatus(token, id, { status, suspendedUntil }) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, suspendedUntil })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Không thể cập nhật trạng thái người dùng.');
    }
    return res.json(); // backend trả về user đã update
  };
}

export default UserApi;
