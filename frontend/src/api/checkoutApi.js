const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
export const checkoutApi = {
  /**
   * Lấy thông tin booking để hiển thị (roomName, checkIn, checkOut, winningPrice, ...)
   * Backend endpoint kỳ vọng: GET /api/bookings/:bookingId
   * Trả về: object booking (json.data)
   */
  getBooking: async (bookingId, abortSignal = null) => {
    if (!bookingId) throw new Error('bookingId is required');

    try {
      const fetchOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      if (abortSignal) fetchOptions.signal = abortSignal;

      const res = await fetch(`${API_BASE_URL}/api/checkout/${bookingId}`, fetchOptions);

      if (!res.ok) {
        let message = `HTTP error! status: ${res.status}`;
        try {
          const errJson = await res.json();
          message = errJson?.message || errJson?.error || message;
        } catch {}
        throw new Error(message);
      }

      const json = await res.json(); // kỳ vọng { ok:true, data:{...} }
      if (!json?.ok) throw new Error(json?.error || 'Cannot load booking');

      return json.data; // trả về đúng object booking
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Checkout API request was aborted');
        throw error;
      }
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  /**
   * Tạo đơn ZaloPay (sandbox)
   * Backend endpoint: POST /api/payments/zalopay/create
   * body: { bookingId, amount }
   * Trả về: json.zalo (chứa order_url, app_trans_id, ...)
   */
  createZaloPayOrder: async ({ bookingId, amount }, abortSignal = null) => {
    if (!bookingId) throw new Error('bookingId is required');
    if (amount == null) throw new Error('amount is required');

    try {
      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      };
      if (abortSignal) fetchOptions.signal = abortSignal;

      const res = await fetch(`${API_BASE_URL}/api/checkout/zalopay/create`, fetchOptions);

      if (!res.ok) {
        let message = `HTTP error! status: ${res.status}`;
        try {
          const errJson = await res.json();
          message = errJson?.message || errJson?.error || message;
        } catch {}
        throw new Error(message);
      }

      const json = await res.json(); // kỳ vọng { ok:true, zalo:{ order_url, ... } }
      if (!json?.ok || !json?.zalo) {
        throw new Error(json?.error || 'Create ZaloPay order failed');
      }

      return json.zalo; // { order_url, app_trans_id, ... }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Checkout API request was aborted');
        throw error;
      }
      console.error('Error creating ZaloPay order:', error);
      throw error;
    }
  },

  /**
   * Tạo order PayPal (flow cơ bản không vault)
   * Backend endpoint: POST /api/payments/paypal/create
   * body: { bookingId, amount }
   * Trả về: { approveUrl, orderId }
   */
  createPayPalOrder: async ({ bookingId, amount }, abortSignal = null) => {
    if (!bookingId) throw new Error('bookingId is required');
    if (amount == null) throw new Error('amount is required');

    try {
      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      };
      if (abortSignal) fetchOptions.signal = abortSignal;

      const res = await fetch(`${API_BASE_URL}/api/checkout/paypal/create`, fetchOptions);

      if (!res.ok) {
        let message = `HTTP error! status: ${res.status}`;
        try {
          const errJson = await res.json();
          message = errJson?.message || errJson?.error || message;
        } catch {}
        throw new Error(message);
      }

      const json = await res.json(); // kỳ vọng { ok:true, approveUrl:'...', orderId:'...' }
      if (!json?.ok || !json?.approveUrl) {
        throw new Error(json?.error || 'Create PayPal order failed');
      }

      return { approveUrl: json.approveUrl, orderId: json.orderId };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Checkout API request was aborted');
        throw error;
      }
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  },

  // Thêm vào object export của checkoutApi
  capturePayPalOrder: async ({ bookingId, orderID }, abortSignal = null) => {
    if (!bookingId) throw new Error('bookingId is required');
    if (!orderID) throw new Error('orderID is required');

    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, orderID }),
    };
    if (abortSignal) fetchOptions.signal = abortSignal;

    const res = await fetch(`${API_BASE_URL}/api/checkout/paypal/capture`, fetchOptions);

    // Bắt lỗi “trả HTML” để dễ debug
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON, got ${res.status} ${ct}. First bytes: ${text.slice(0,120)}`);
    }

    const json = await res.json(); // kỳ vọng { ok: true, ... }
    if (!res.ok || !json?.ok) throw new Error(json?.error || 'Capture failed');
    return json; // nếu cần có thể trả { ok, captureId, ... }
  },
};

export default checkoutApi;