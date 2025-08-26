const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const bookingApi = {
  place: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/booking/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false || data?.ok === false) {
      const err = new Error(data?.message || 'Đặt chỗ thất bại');
      err.status = res.status;           // ví dụ: 409
      err.rawMessage = data?.message;    // giữ lại message gốc của BE
      throw err;
    }
    return data; // { ok, bookingId, holdExpiresAt }
  },
  
  buyNow: async ({ uid, userId, checkin, checkout }) => {
    const r = await fetch(`${API_BASE_URL}/api/booking/buy-now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, userId, checkin, checkout }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || 'Thuê ngay thất bại');
    // kỳ vọng: { success:true, bookingId, holdExpiresAt? }
    return data;
  },

  getUserTransactionHistory: async () => {
    return apiCall('/user/transaction-history');
  },
};

// Helper cho các API đơn giản kiểu GET
async function apiCall(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'API call failed');
  return data;
}

export default bookingApi;
