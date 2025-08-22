const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const bookingApi = {
  place: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/booking/place`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Đặt chỗ thất bại');
    return res.json();
  },

//   confirmPayment: async (payload) => {
//     const res = await fetch(`${API_BASE_URL}/bookings/payments/confirm`, {
//       method: 'POST', headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });
//     if (!res.ok) throw new Error((await res.json()).message || 'Xác nhận thanh toán thất bại');
//     return res.json();
//   },

//   failPayment: async (payload) => {
//     const res = await fetch(`${API_BASE_URL}/bookings/payments/fail`, {
//       method: 'POST', headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });
//     if (!res.ok) throw new Error((await res.json()).message || 'Hủy/thất bại thanh toán lỗi');
//     return res.json();
//   },
};

export default bookingApi;
