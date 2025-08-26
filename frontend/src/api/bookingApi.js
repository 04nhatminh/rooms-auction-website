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
    const res = await fetch(`${API_BASE_URL}/user/transaction-history`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Không lấy được lịch sử giao dịch');
    return await res.json();
  }
};

export default bookingApi;
