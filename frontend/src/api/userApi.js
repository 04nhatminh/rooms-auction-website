const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
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
      headers: this.getHeaders(),
      credentials: 'include'
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
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: 'include'
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to change password');
    return res.json();
  }

  static async handle(res, fallbackMsg) {
    const msg = await this.safeMessage(res);
    if (!res.ok) {
      const err = new Error(msg || fallbackMsg || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    // nếu backend trả rỗng thì trả {} cho an toàn
    try { return JSON.parse(msg); } catch { return {}; }
  }

  static async safeMessage(res) {
    try {
      const text = await res.text();
      try { return JSON.parse(text)?.message || text; } catch { return text; }
    } catch { return null; }
  }

  static async getUsers(page = 1, limit = 10) {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();

    // timeout nhẹ để tránh treo
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12000);

    try {
      const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users?${qs}`, {
        method: 'GET',
        credentials: 'include',                // 👈 bắt buộc khi dùng cookie HttpOnly
        headers: { 'Accept': 'application/json' },
        signal: ac.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Máy chủ phản hồi quá lâu.');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  static async deleteUser(id) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',                     // 👈 gửi cookie
      headers: { Accept: 'application/json' },
    });
    return this.handle(res, 'Không thể xóa người dùng.');
  };

  static async getUserById(id) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}`, {
      method: 'GET',
      credentials: 'include',                     // 👈 gửi cookie
      headers: { Accept: 'application/json' },
    });
    return this.handle(res, 'Không thể lấy thông tin người dùng.');
  };

  static async updateUserStatus(id, { status, suspendedUntil }) {
    const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',                     // 👈 gửi cookie
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ status, suspendedUntil }),
    });
    return this.handle(res, 'Không thể cập nhật trạng thái người dùng.');
  };
}

export default UserApi;