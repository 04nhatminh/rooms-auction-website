const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
const ADMIN_PREFIX = '/admin';

export const getUsers = async (token, page = 1, limit = 10) => {
  const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const msg = await safeMessage(res);
    throw new Error(msg || 'Không thể lấy danh sách người dùng.');
  }
  return res.json();
};

export const deleteUser = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const msg = await safeMessage(res);
    throw new Error(msg || 'Không thể xóa người dùng.');
  }
  return res.json();
};

// helper để đọc message lỗi nếu backend trả JSON/text
async function safeMessage(res) {
  try {
    const text = await res.text();
    try { return JSON.parse(text)?.message || text; } catch { return text; }
  } catch { return null; }
}

export const getUserById = async (token, id) => {
  const res = await fetch(`${API_BASE_URL}${ADMIN_PREFIX}/users/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(await res.text() || 'Không thể lấy thông tin người dùng.');
  return res.json();
};

export const updateUserStatus = async (token, id, { status, suspendedUntil }) => {
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